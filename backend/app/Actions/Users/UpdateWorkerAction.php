<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Data\WorkerChangesData;
use App\Models\User;
use App\Support\Audit\AuditLogger;
use App\Support\Session\UserSessions;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final readonly class UpdateWorkerAction
{
    public function __construct(
        private AuditLogger $audit,
        private UserSessions $sessions,
    ) {}

    /**
     * Changes the name and activity of a hall worker; deactivating signs the worker out everywhere and is audited.
     *
     * @throws ModelNotFoundException when the id does not belong to a hall worker
     */
    public function handle(User $actor, int $workerId, WorkerChangesData $changes, ?string $ip): User
    {
        return DB::transaction(function () use ($actor, $workerId, $changes, $ip): User {
            $worker = User::query()->workers()->lockForUpdate()->findOrFail($workerId);
            $wasActive = $worker->is_active;

            $worker->fill(array_filter([
                'first_name' => $changes->firstName,
                'last_name' => $changes->lastName,
                'is_active' => $changes->isActive,
            ], static fn (string|bool|null $value): bool => $value !== null));
            $worker->save();

            if ($wasActive && ! $worker->is_active) {
                $this->sessions->revokeAll($worker);
                $this->audit->log($actor, AuditLogger::USER_DEACTIVATED, $worker, ['is_active' => true], ['is_active' => false], $ip);
            }

            return $worker;
        });
    }
}
