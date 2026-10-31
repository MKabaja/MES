<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

final class SetLocaleFromHeader
{
    private const SUPPORTED_LOCALES = ['pl', 'en'];

    /**
     * Sets the application locale to the supported language preferred in Accept-Language, defaulting to Polish.
     */
    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale($request->getPreferredLanguage(self::SUPPORTED_LOCALES) ?? self::SUPPORTED_LOCALES[0]);

        return $next($request);
    }
}
