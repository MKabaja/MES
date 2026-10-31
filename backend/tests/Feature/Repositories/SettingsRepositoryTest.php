<?php

declare(strict_types=1);

use App\Domain\ValueObjects\BreakWindow;
use App\Domain\ValueObjects\PlantSettings;
use App\Repositories\SettingsRepository;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

function customPlantSettings(): PlantSettings
{
    return new PlantSettings(
        shiftStart: '07:30',
        shiftEnd: '15:30',
        breaks: [new BreakWindow('09:00', '09:15'), new BreakWindow('12:00', '12:30')],
        deductBreaks: false,
        autoPauseEnabled: false,
        workerBackdateDays: 4,
        stationIdleLogoutMinutes: 15,
        workerNetworkRestrictionEnabled: true,
        workerAllowedNetworks: ['192.168.1.0/24', '10.0.0.5'],
    );
}

it('provides the default plant settings after migration', function (): void {
    $settings = resolve(SettingsRepository::class)->current();

    expect($settings)->toEqual(new PlantSettings(
        shiftStart: '06:00',
        shiftEnd: '14:00',
        breaks: [new BreakWindow('10:00', '10:15')],
        deductBreaks: true,
        autoPauseEnabled: true,
        workerBackdateDays: 2,
        stationIdleLogoutMinutes: 5,
        workerNetworkRestrictionEnabled: false,
        workerAllowedNetworks: [],
    ));
});

it('returns saved settings unchanged', function (): void {
    $repository = resolve(SettingsRepository::class);
    $repository->current();

    $repository->save(customPlantSettings());

    expect($repository->current())->toEqual(customPlantSettings());
});

it('keeps a single settings row at the database level', function (): void {
    DB::table('settings')->insert([
        'id' => 2,
        'shift_start' => '06:00',
        'shift_end' => '14:00',
        'breaks' => '[]',
        'deduct_breaks' => true,
        'auto_pause_enabled' => true,
        'worker_backdate_days' => 2,
        'station_idle_logout_minutes' => 5,
        'worker_network_restriction_enabled' => false,
        'worker_allowed_networks' => '[]',
    ]);
})->throws(QueryException::class);
