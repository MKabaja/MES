<?php

declare(strict_types=1);

use App\Domain\ValueObjects\BreakWindow;
use App\Domain\ValueObjects\PlantSettings;
use App\Models\User;
use App\Repositories\SettingsRepository;

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');

    resolve(SettingsRepository::class)->save(new PlantSettings(
        shiftStart: '06:00',
        shiftEnd: '14:00',
        breaks: [new BreakWindow('10:00', '10:15')],
        deductBreaks: true,
        autoPauseEnabled: false,
        workerBackdateDays: 3,
        stationIdleLogoutMinutes: 7,
        workerNetworkRestrictionEnabled: true,
        workerAllowedNetworks: ['192.168.1.0/24', 'fd00::/8'],
    ));
});

it('returns the full settings to an admin', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->getJson(route('settings.show'));

    $response->assertOk()->assertExactJson(['data' => [
        'shift_start' => '06:00',
        'shift_end' => '14:00',
        'breaks' => [['start' => '10:00', 'end' => '10:15']],
        'deduct_breaks' => true,
        'auto_pause_enabled' => false,
        'worker_backdate_days' => 3,
        'station_idle_logout_minutes' => 7,
        'worker_network_restriction_enabled' => true,
        'worker_allowed_networks' => ['192.168.1.0/24', 'fd00::/8'],
    ]]);
});

it('returns 403 when a worker reads the full settings', function (): void {
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '192.168.1.20'])
        ->getJson(route('settings.show'));

    $response->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
});

it('returns 401 when a guest reads the full settings', function (): void {
    $response = $this->getJson(route('settings.show'));

    $response->assertUnauthorized()->assertJsonPath('code', 'UNAUTHENTICATED');
});

it('returns only the public settings to a worker', function (): void {
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '192.168.1.20'])
        ->getJson(route('settings.public'));

    $response->assertOk()->assertExactJson(['data' => [
        'shift_start' => '06:00',
        'shift_end' => '14:00',
        'breaks' => [['start' => '10:00', 'end' => '10:15']],
        'worker_backdate_days' => 3,
        'station_idle_logout_minutes' => 7,
    ]]);
});
