<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\LoginData;
use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use App\Domain\Services\WorkerNetworkAccess;
use App\Models\User;
use App\Repositories\SettingsRepository;
use App\Support\Auth\DummyPasswordHash;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Str;

final readonly class LoginAction
{
    public function __construct(
        private StatefulGuard $guard,
        private Hasher $hasher,
        private DummyPasswordHash $dummyPasswordHash,
        private WorkerNetworkAccess $networkAccess,
        private SettingsRepository $settings,
    ) {}

    /**
     * Signs the user in with a case-insensitive login from an allowed network and starts a fresh session.
     *
     * @throws DomainException INVALID_CREDENTIALS for an unknown login or a wrong password, ACCOUNT_INACTIVE for a disabled account, NETWORK_NOT_ALLOWED for a non-admin outside the allowed networks
     */
    public function handle(LoginData $credentials, string $ip, Session $session): User
    {
        $user = User::query()
            ->whereRaw('lower(login) = ?', [Str::lower($credentials->login)])
            ->first();

        $dummyHash = $this->dummyPasswordHash->value();
        $isPasswordValid = $this->hasher->check($credentials->password, $user->password ?? $dummyHash);

        if ($user === null || ! $isPasswordValid) {
            throw new DomainException(ErrorCode::InvalidCredentials, field: 'login');
        }

        if (! $user->is_active) {
            throw new DomainException(ErrorCode::AccountInactive);
        }

        $this->networkAccess->assertAllowed($user, $ip, $this->settings->current());

        $this->guard->login($user);
        $session->regenerate();

        return $user;
    }
}
