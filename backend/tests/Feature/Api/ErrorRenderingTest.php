<?php

declare(strict_types=1);

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Access\Response as AccessResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Exceptions\OriginMismatchException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

function throwFromTestRoute(Throwable $exception): void
{
    Route::middleware('api')->get('api/v1/_test/throw', fn () => throw $exception);
}

/**
 * @return array<string, int>
 */
function statusByErrorCode(): array
{
    return [
        'UNAUTHENTICATED' => 401,
        'FORBIDDEN' => 403,
        'NOT_FOUND' => 404,
        'CSRF_MISMATCH' => 419,
        'VALIDATION_FAILED' => 422,
        'TOO_MANY_REQUESTS' => 429,
        'SERVER_ERROR' => 500,
        'INVALID_CREDENTIALS' => 422,
        'ACCOUNT_INACTIVE' => 403,
        'NETWORK_NOT_ALLOWED' => 403,
        'CODE_NOT_FOUND' => 404,
        'ORDER_NOT_DRAFT' => 409,
        'ORDER_HAS_NO_POSITIONS' => 409,
        'ORDER_HAS_OPEN_SEGMENTS' => 409,
        'ORDER_LOCKED' => 409,
        'ORDER_NOT_ACTIVE' => 409,
        'POSITION_COMPLETED' => 409,
        'POSITION_HAS_WORK' => 409,
        'ALREADY_WORKING' => 409,
        'NO_OPEN_SEGMENT' => 409,
        'USER_HAS_OPEN_SEGMENT' => 409,
        'IDEMPOTENCY_KEY_REUSED' => 409,
        'TIME_IN_FUTURE' => 422,
        'TIME_BEFORE_POSITION' => 422,
        'TIME_TOO_FAR_BACK' => 422,
        'TIME_END_BEFORE_START' => 422,
        'SEGMENT_OVERLAP' => 422,
    ];
}

it('renders every error code with its contract status and the envelope', function (string $code, int $status): void {
    throwFromTestRoute(new DomainException(ErrorCode::from($code), 'Komunikat testowy.'));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertStatus($status)
        ->assertExactJson(['message' => 'Komunikat testowy.', 'code' => $code]);
})->with(function () {
    foreach (statusByErrorCode() as $code => $status) {
        yield $code => [$code, $status];
    }
});

it('has a dataset entry for every error code', function (): void {
    $datasetCodes = array_keys(statusByErrorCode());
    $enumCodes = array_map(fn (ErrorCode $code) => $code->value, ErrorCode::cases());

    expect($datasetCodes)->toEqualCanonicalizing($enumCodes);
});

it('puts the message under the field when a domain error names one', function (): void {
    throwFromTestRoute(new DomainException(ErrorCode::SegmentOverlap, 'Odcinek nachodzi na Twoją pracę.', 'started_at'));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertUnprocessable()
        ->assertExactJson([
            'message' => 'Odcinek nachodzi na Twoją pracę.',
            'code' => 'SEGMENT_OVERLAP',
            'errors' => ['started_at' => ['Odcinek nachodzi na Twoją pracę.']],
        ]);
});

it('renders framework exceptions in the envelope', function (Closure $makeException, int $status, string $code, string $message): void {
    throwFromTestRoute($makeException());

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertStatus($status)
        ->assertExactJson(['message' => $message, 'code' => $code]);
})->with([
    'authentication' => [fn () => new AuthenticationException, 401, 'UNAUTHENTICATED', 'Brak aktywnej sesji. Zaloguj się.'],
    'authorization' => [fn () => new AuthorizationException, 403, 'FORBIDDEN', 'Brak uprawnień do wykonania tej operacji.'],
    'access denied' => [fn () => new AccessDeniedHttpException, 403, 'FORBIDDEN', 'Brak uprawnień do wykonania tej operacji.'],
    'denied as not found' => [fn () => (new AuthorizationException)->withStatus(404), 404, 'NOT_FOUND', 'Nie znaleziono zasobu.'],
    'model not found' => [fn () => new ModelNotFoundException, 404, 'NOT_FOUND', 'Nie znaleziono zasobu.'],
    'route not found' => [fn () => new NotFoundHttpException, 404, 'NOT_FOUND', 'Nie znaleziono zasobu.'],
    'origin mismatch' => [fn () => new OriginMismatchException, 403, 'FORBIDDEN', 'Brak uprawnień do wykonania tej operacji.'],
    'csrf mismatch' => [fn () => new TokenMismatchException, 419, 'CSRF_MISMATCH', 'Sesja wygasła. Odśwież stronę i spróbuj ponownie.'],
    'throttled' => [fn () => new ThrottleRequestsException, 429, 'TOO_MANY_REQUESTS', 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.'],
]);

it('does not report domain exceptions but reports unexpected ones', function (): void {
    Exceptions::fake();
    Route::middleware('api')->get('api/v1/_test/domain', fn () => throw new DomainException(ErrorCode::OrderLocked, 'Zlecenie zablokowane.'));
    Route::middleware('api')->get('api/v1/_test/boom', fn () => throw new RuntimeException('boom'));

    $this->getJson('api/v1/_test/domain');
    $this->getJson('api/v1/_test/boom');

    Exceptions::assertNotReported(DomainException::class);
    Exceptions::assertReported(RuntimeException::class);
});

it('passes a prepared HttpResponseException response through untouched', function (): void {
    throwFromTestRoute(new HttpResponseException(response()->json(['custom' => true], 418)));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertStatus(418)->assertExactJson(['custom' => true]);
});

it('renders validation failures with errors per field', function (): void {
    throwFromTestRoute(ValidationException::withMessages(['name' => ['Pole jest wymagane.']]));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertUnprocessable()
        ->assertExactJson([
            'message' => 'Dane są nieprawidłowe.',
            'code' => 'VALIDATION_FAILED',
            'errors' => ['name' => ['Pole jest wymagane.']],
        ]);
});

it('renders a denial as not found through the policy response', function (): void {
    Route::middleware('api')->get('api/v1/_test/deny', fn () => AccessResponse::denyAsNotFound()->authorize());

    $response = $this->getJson('api/v1/_test/deny');

    $response->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
});

it('keeps the Retry-After header on throttled responses', function (): void {
    throwFromTestRoute(new ThrottleRequestsException('Too many', headers: ['Retry-After' => '30']));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertTooManyRequests()->assertHeader('Retry-After', '30');
});

it('returns 404 in the envelope for an unknown api route', function (): void {
    $response = $this->getJson('api/v1/does-not-exist');

    $response->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
});

it('hides details of unexpected errors when debug is off', function (): void {
    config(['app.debug' => false]);
    throwFromTestRoute(new RuntimeException('SQLSTATE secret internals'));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertStatus(500)
        ->assertExactJson(['message' => 'Wystąpił błąd serwera.', 'code' => 'SERVER_ERROR']);
    expect($response->getContent())->not->toContain('secret internals');
});

it('hides details of unexpected errors when debug is on', function (): void {
    config(['app.debug' => true]);
    throwFromTestRoute(new RuntimeException('SQLSTATE secret internals'));

    $response = $this->getJson('api/v1/_test/throw');

    $response->assertStatus(500)
        ->assertExactJson(['message' => 'Wystąpił błąd serwera.', 'code' => 'SERVER_ERROR']);
    expect($response->getContent())->not->toContain('secret internals');
});
