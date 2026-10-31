<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Enums\ErrorCode;
use App\Domain\Enums\Role;
use App\Domain\Exceptions\DomainException;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureRole
{
    /**
     * Lets the request through only when the signed-in user has one of the given roles.
     *
     * @param  Closure(Request): Response  $next
     *
     * @throws AuthenticationException
     * @throws DomainException FORBIDDEN
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user() ?? throw new AuthenticationException;

        $allowedRoles = array_map(Role::from(...), $roles);

        if (! in_array($user->role, $allowedRoles, true)) {
            throw new DomainException(ErrorCode::Forbidden);
        }

        return $next($request);
    }
}
