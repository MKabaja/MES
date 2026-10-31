<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Actions\Auth\LogoutAction;
use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class EnsureUserIsActive
{
    public function __construct(private LogoutAction $logout) {}

    /**
     * Signs out a user whose account was disabled during the session and rejects the request.
     *
     * @param  Closure(Request): Response  $next
     *
     * @throws AuthenticationException
     * @throws DomainException ACCOUNT_INACTIVE
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? throw new AuthenticationException;

        if (! $user->is_active) {
            $this->logout->handle($request->session());

            throw new DomainException(ErrorCode::AccountInactive);
        }

        return $next($request);
    }
}
