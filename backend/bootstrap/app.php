<?php

declare(strict_types=1);

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Exceptions\OriginMismatchException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport(DomainException::class);

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        /**
         * @param  array<string, list<string>>  $errors
         * @param  array<string, string>  $headers
         */
        $envelope = function (
            ErrorCode $code,
            string $message,
            array $errors = [],
            array $headers = [],
        ): JsonResponse {
            $body = ['message' => $message, 'code' => $code->value];

            if ($errors !== []) {
                $body['errors'] = $errors;
            }

            return response()->json($body, $code->status(), $headers);
        };

        $exceptions->render(function (Throwable $exception, Request $request) use ($envelope): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            $forbidden = fn () => $envelope(ErrorCode::Forbidden, 'Brak uprawnień do wykonania tej operacji.');
            $notFound = fn () => $envelope(ErrorCode::NotFound, 'Nie znaleziono zasobu.');
            $cause = $exception->getPrevious();

            return match (true) {
                $exception instanceof HttpResponseException => null,
                $exception instanceof DomainException => $envelope(
                    $exception->errorCode,
                    $exception->getMessage(),
                    $exception->field === null ? [] : [$exception->field => [$exception->getMessage()]],
                ),
                $exception instanceof ValidationException => $envelope(
                    ErrorCode::ValidationFailed,
                    'Dane są nieprawidłowe.',
                    $exception->errors(),
                ),
                $exception instanceof AuthenticationException => $envelope(
                    ErrorCode::Unauthenticated,
                    'Brak aktywnej sesji. Zaloguj się.',
                ),
                $exception instanceof AccessDeniedHttpException => $forbidden(),
                $exception instanceof NotFoundHttpException => $notFound(),
                $exception instanceof TooManyRequestsHttpException => $envelope(
                    ErrorCode::TooManyRequests,
                    'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
                    headers: array_intersect_key($exception->getHeaders(), ['Retry-After' => true]),
                ),
                $exception instanceof HttpException && $cause instanceof TokenMismatchException => $envelope(
                    ErrorCode::CsrfMismatch,
                    'Sesja wygasła. Odśwież stronę i spróbuj ponownie.',
                ),
                $exception instanceof HttpException && $cause instanceof AuthorizationException => $cause->status() === 404
                    ? $notFound()
                    : $forbidden(),
                $exception instanceof HttpException && $cause instanceof OriginMismatchException => $forbidden(),
                default => $envelope(ErrorCode::ServerError, 'Wystąpił błąd serwera.'),
            };
        });
    })->create();
