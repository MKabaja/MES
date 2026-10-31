<?php

declare(strict_types=1);

use App\Support\Session\SecureSessionCookie;

it('requires a secure session cookie in production even when the setting disables it', function (): void {
    expect(SecureSessionCookie::isRequired('production', false))->toBeTrue();
});

it('does not require a secure session cookie locally by default', function (): void {
    expect(SecureSessionCookie::isRequired('local', null))->toBeFalse();
});
