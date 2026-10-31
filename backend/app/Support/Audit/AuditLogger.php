<?php

declare(strict_types=1);

namespace App\Support\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    public const SEGMENT_CORRECTED = 'segment.corrected';

    public const OPERATION_TYPE_RATE_CHANGED = 'operation_type.rate_changed';

    public const POSITION_RATE_CHANGED = 'position.rate_changed';

    public const MATERIAL_STOCK_CHANGED = 'material.stock_changed';

    public const USER_DEACTIVATED = 'user.deactivated';

    public const USER_PASSWORD_RESET = 'user.password_reset';

    public const SETTINGS_UPDATED = 'settings.updated';

    public const POSITION_REOPENED = 'position.reopened';

    public const ORDER_CANCELLED = 'order.cancelled';

    private const SENSITIVE_KEY_FRAGMENTS = ['password', 'token', 'secret'];

    /**
     * Records a change of the subject with its values before and after, never storing passwords or tokens.
     *
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function log(
        ?User $actor,
        string $action,
        Model $subject,
        ?array $before,
        ?array $after,
        ?string $ip = null,
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $actor?->getKey(),
            'action' => $action,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'before' => $before === null ? null : $this->withoutSensitiveKeys($before),
            'after' => $after === null ? null : $this->withoutSensitiveKeys($after),
            'ip' => $ip,
        ]);
    }

    /**
     * @param  array<array-key, mixed>  $values
     * @return array<array-key, mixed>
     */
    private function withoutSensitiveKeys(array $values): array
    {
        $kept = [];

        foreach ($values as $key => $value) {
            if (is_string($key) && $this->isSensitiveKey($key)) {
                continue;
            }

            $kept[$key] = is_array($value) ? $this->withoutSensitiveKeys($value) : $value;
        }

        return $kept;
    }

    private function isSensitiveKey(string $key): bool
    {
        return array_any(
            self::SENSITIVE_KEY_FRAGMENTS,
            static fn (string $fragment): bool => str_contains(strtolower($key), $fragment),
        );
    }
}
