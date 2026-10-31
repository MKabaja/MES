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
use App\Support\Auth\FailedLoginLimiter;
use Illuminate\Auth\SessionGuard;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Facades\DB;

final readonly class LoginAction
{
    private const string PASSWORD_HASH_SESSION_KEY = 'password_hash_web';

    public function __construct(
        private SessionGuard $guard,
        private Hasher $hasher,
        private DummyPasswordHash $dummyPasswordHash,
        private FailedLoginLimiter $failedLoginLimiter,
        private WorkerNetworkAccess $networkAccess,
        private SettingsRepository $settings,
    ) {}

    /**
     * Signs the user in with a case-insensitive login from an allowed network and starts a fresh session, refusing networks with too many recent failed attempts.
     *
     * @throws DomainException INVALID_CREDENTIALS for an unknown login or a wrong password, ACCOUNT_INACTIVE for a disabled account, NETWORK_NOT_ALLOWED for a non-admin outside the allowed networks
     */
    public function handle(LoginData $credentials, string $ip, Session $session): User
    {
        $this->failedLoginLimiter->registerAttempt($ip);

        $isCountedAgainstAccount = ! $this->networkAccess->isInsideAllowedNetworks($ip, $this->settings->current());

        if ($isCountedAgainstAccount) {
            $this->failedLoginLimiter->registerAccountAttempt($credentials->login);
        }

        $user = User::query()
            ->whereLoginIs($credentials->login)
            ->first();

        $dummyHash = $this->dummyPasswordHash->value();
        $isPasswordValid = $this->hasher->check($credentials->password, $user->password ?? $dummyHash);

        if ($user === null || ! $isPasswordValid) {
            throw new DomainException(ErrorCode::InvalidCredentials, field: 'login');
        }

        $this->failedLoginLimiter->releaseAttempt($ip);

        if (! $user->is_active) {
            throw new DomainException(ErrorCode::AccountInactive);
        }

        $this->networkAccess->assertAllowed($user, $ip, $this->settings->current());

        if ($isCountedAgainstAccount) {
            $this->failedLoginLimiter->releaseAccountAttempt($credentials->login);
        }

        $verifiedHash = $user->password;

        if ($this->hasher->needsRehash($verifiedHash)) {
            $verifiedHash = $this->rehashPassword($user, $credentials->password, $verifiedHash);
        }

        $session->flush();
        $this->guard->login($user);
        $session->regenerate(destroy: true);
        $session->put(
            self::PASSWORD_HASH_SESSION_KEY,
            $this->guard->hashPasswordForCookie($verifiedHash),
        );

        return $user;
    }

    private function rehashPassword(User $user, string $password, string $verifiedHash): string
    {
        $rehashedHash = DB::transaction(function () use ($user, $password, $verifiedHash): ?string {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($lockedUser->password !== $verifiedHash) {
                return null;
            }

            $lockedUser->update(['password' => $this->hasher->make($password)]);

            return $lockedUser->password;
        });

        if ($rehashedHash === null) {
            return $verifiedHash;
        }

        $user->refresh();

        return $rehashedHash;
    }
}
