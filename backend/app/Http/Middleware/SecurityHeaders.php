<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

final class SecurityHeaders
{
    /**
     * Adds the security headers to every API response, including errors and unmatched routes.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->is('api/*')) {
            return $response;
        }

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=()');

        $hstsMaxAgeInSeconds = Config::integer('mes.hsts.max_age');

        if (! app()->environment('local') && $hstsMaxAgeInSeconds > 0) {
            $includeSubdomains = Config::boolean('mes.hsts.include_subdomains') ? '; includeSubDomains' : '';

            $response->headers->set('Strict-Transport-Security', "max-age={$hstsMaxAgeInSeconds}{$includeSubdomains}");
        }

        return $response;
    }
}
