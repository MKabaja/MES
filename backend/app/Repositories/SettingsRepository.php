<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Domain\ValueObjects\BreakWindow;
use App\Domain\ValueObjects\PlantSettings;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class SettingsRepository
{
    private ?PlantSettings $current = null;

    /**
     * Returns the plant settings, reading them from the database once per repository instance.
     */
    public function current(): PlantSettings
    {
        return $this->current ??= $this->toValueObject(Setting::query()->findOrFail(Setting::SINGLETON_ID));
    }

    /**
     * Persists the plant settings in a transaction and drops the memoized copy.
     */
    public function save(PlantSettings $settings): void
    {
        DB::transaction(function () use ($settings): void {
            $setting = Setting::query()->lockForUpdate()->findOrFail(Setting::SINGLETON_ID);

            $setting->fill([
                'shift_start' => $settings->shiftStart,
                'shift_end' => $settings->shiftEnd,
                'breaks' => array_map(
                    static fn (BreakWindow $break): array => ['start' => $break->start, 'end' => $break->end],
                    $settings->breaks,
                ),
                'deduct_breaks' => $settings->deductBreaks,
                'auto_pause_enabled' => $settings->autoPauseEnabled,
                'worker_backdate_days' => $settings->workerBackdateDays,
                'station_idle_logout_minutes' => $settings->stationIdleLogoutMinutes,
                'worker_network_restriction_enabled' => $settings->workerNetworkRestrictionEnabled,
                'worker_allowed_networks' => $settings->workerAllowedNetworks,
            ])->save();
        });

        $this->current = null;
    }

    private function toValueObject(Setting $setting): PlantSettings
    {
        /** @var list<array{start: string, end: string}> $breaks */
        $breaks = $setting->breaks;
        /** @var list<string> $networks */
        $networks = $setting->worker_allowed_networks;

        return new PlantSettings(
            shiftStart: substr((string) $setting->shift_start, 0, 5),
            shiftEnd: substr((string) $setting->shift_end, 0, 5),
            breaks: array_map(
                static fn (array $break): BreakWindow => new BreakWindow($break['start'], $break['end']),
                $breaks,
            ),
            deductBreaks: $setting->deduct_breaks,
            autoPauseEnabled: $setting->auto_pause_enabled,
            workerBackdateDays: $setting->worker_backdate_days,
            stationIdleLogoutMinutes: $setting->station_idle_logout_minutes,
            workerNetworkRestrictionEnabled: $setting->worker_network_restriction_enabled,
            workerAllowedNetworks: $networks,
        );
    }
}
