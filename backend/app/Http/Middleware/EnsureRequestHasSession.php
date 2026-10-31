<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class EnsureRequestHasSession
{
    /**
     * Rejects with 403 a request that did not come from the stateful SPA and therefore has no session.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->hasSession()) {
            throw new AccessDeniedHttpException;
        }

        return $next($request);
    }
}
