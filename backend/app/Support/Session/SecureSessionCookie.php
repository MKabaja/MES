<?php

declare(strict_types=1);

namespace App\Support\Session;

final class SecureSessionCookie
{
    private const string PRODUCTION_ENVIRONMENT = 'production';

    private const string LOCAL_ENVIRONMENT = 'local';

    /**
     * Decides whether the session cookie is sent only over HTTPS: always in production, otherwise as configured, by default everywhere except local.
     */
    public static function isRequired(string $environment, ?bool $configuredSecureCookie): bool
    {
        if ($environment === self::PRODUCTION_ENVIRONMENT) {
            return true;
        }

        return $configuredSecureCookie ?? $environment !== self::LOCAL_ENVIRONMENT;
    }
}
