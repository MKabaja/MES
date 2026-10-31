<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Contracts\Session\Session;

final readonly class LogoutAction
{
    public function __construct(private StatefulGuard $guard) {}

    /**
     * Signs the current user out, invalidates the session and issues a new CSRF token.
     */
    public function handle(Session $session): void
    {
        $this->guard->logout();
        $session->invalidate();
        $session->regenerateToken();
    }
}
