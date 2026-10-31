<?php

declare(strict_types=1);

namespace App\Actions\Settings;

use App\Data\SettingsData;
use App\Domain\ValueObjects\PlantSettings;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\SettingsRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final readonly class UpdateSettingsAction
{
    public function __construct(
        private SettingsRepository $settings,
        private AuditLogger $audit,
    ) {}

    /**
     * Replaces the plant settings and records the values before and after in the audit log.
     *
     * @throws InvalidArgumentException when the data breaks an invariant of the plant settings
     */
    public function handle(User $actor, SettingsData $data, ?string $ip): PlantSettings
    {
        $updated = $data->toPlantSettings();

        return DB::transaction(function () use ($actor, $updated, $ip): PlantSettings {
            $subject = Setting::query()->lockForUpdate()->findOrFail(Setting::SINGLETON_ID);
            $before = $this->settings->readForUpdate()->toArray();

            $this->settings->save($updated);

            $this->audit->log($actor, AuditLogger::SETTINGS_UPDATED, $subject, $before, $updated->toArray(), $ip);

            return $updated;
        });
    }
}
