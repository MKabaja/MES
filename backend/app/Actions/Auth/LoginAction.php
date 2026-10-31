<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\LoginData;
use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use App\Models\User;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Str;

final class LoginAction
{
    private static ?string $dummyHash = null;

    public function __construct(
        private readonly StatefulGuard $guard,
        private readonly Hasher $hasher,
    ) {}

    /**
     * Signs the user in with a case-insensitive login and starts a fresh session.
     *
     * @throws DomainException INVALID_CREDENTIALS for an unknown login or a wrong password, ACCOUNT_INACTIVE for a disabled account
     */
    public function handle(LoginData $credentials, Session $session): User
    {
        $user = User::query()
            ->whereRaw('lower(login) = ?', [Str::lower($credentials->login)])
            ->first();

        $isPasswordValid = $this->hasher->check($credentials->password, $user->password ?? $this->dummyHash());

        if ($user === null || ! $isPasswordValid) {
            throw new DomainException(ErrorCode::InvalidCredentials, field: 'login');
        }

        if (! $user->is_active) {
            throw new DomainException(ErrorCode::AccountInactive);
        }

        $this->guard->login($user);
        $session->regenerate();

        return $user;
    }

    private function dummyHash(): string
    {
        return self::$dummyHash ??= $this->hasher->make(Str::random(40));
    }
}
