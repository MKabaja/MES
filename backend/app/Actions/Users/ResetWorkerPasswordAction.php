<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Models\User;
use App\Support\Audit\AuditLogger;
use App\Support\Session\UserSessions;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final readonly class ResetWorkerPasswordAction
{
    public function __construct(
        private AuditLogger $audit,
        private UserSessions $sessions,
        private Hasher $hasher,
    ) {}

    /**
     * Sets a new password for a hall worker, signs the worker out everywhere and records the reset without the password.
     *
     * @throws ModelNotFoundException when the id does not belong to a hall worker
     */
    public function handle(User $actor, int $workerId, string $password, ?string $ip): void
    {
        DB::transaction(function () use ($actor, $workerId, $password, $ip): void {
            $worker = User::query()->workers()->lockForUpdate()->findOrFail($workerId);

            $worker->password = $this->hasher->make($password);
            $worker->save();

            $this->sessions->revokeAll($worker);
            $this->audit->log($actor, AuditLogger::USER_PASSWORD_RESET, $worker, null, null, $ip);
        });
    }
}
