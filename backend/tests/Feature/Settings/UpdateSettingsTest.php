<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\SettingsRepository;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function settingsPayload(array $overrides = []): array
{
    return [
        'shift_start' => '06:00',
        'shift_end' => '14:00',
        'breaks' => [['start' => '10:00', 'end' => '10:15']],
        'deduct_breaks' => true,
        'auto_pause_enabled' => true,
        'worker_backdate_days' => 2,
        'station_idle_logout_minutes' => 5,
        'worker_network_restriction_enabled' => false,
        'worker_allowed_networks' => ['192.168.1.0/24'],
        ...$overrides,
    ];
}

/**
 * @param  array<string, mixed>|null  $values
 * @return array<string, mixed>
 */
function withSortedKeys(?array $values): array
{
    $sorted = $values ?? [];
    ksort($sorted);

    foreach ($sorted as $key => $value) {
        if (is_array($value)) {
            $sorted[$key] = array_map(
                static function (mixed $item): mixed {
                    if (is_array($item)) {
                        ksort($item);
                    }

                    return $item;
                },
                $value,
            );
        }
    }

    return $sorted;
}

/**
 * @return list<array{start: string, end: string}>
 */
function breaksEveryTenMinutes(int $count): array
{
    return array_map(
        static fn (int $index): array => [
            'start' => sprintf('%02d:00', 7 + $index),
            'end' => sprintf('%02d:10', 7 + $index),
        ],
        range(0, $count - 1),
    );
}

/**
 * @return list<string>
 */
function networkRanges(int $count): array
{
    return array_map(static fn (int $index): string => "10.0.{$index}.0/24", range(1, $count));
}

it('saves the settings, returns them and records the change in the audit log', function (): void {
    $admin = User::factory()->admin()->create();
    $payload = settingsPayload([
        'shift_start' => '07:00',
        'shift_end' => '15:30',
        'breaks' => [['start' => '10:00', 'end' => '10:20'], ['start' => '12:00', 'end' => '12:30']],
        'deduct_breaks' => false,
        'auto_pause_enabled' => false,
        'worker_backdate_days' => 4,
        'station_idle_logout_minutes' => 15,
        'worker_network_restriction_enabled' => true,
        'worker_allowed_networks' => ['10.0.0.0/8', 'fd00::1'],
    ]);

    $response = $this->actingAs($admin, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.9'])
        ->putJson(route('settings.update'), $payload);

    $response->assertOk()->assertExactJson(['data' => $payload]);
    expect(resolve(SettingsRepository::class)->current()->toArray())->toBe($payload);
    $audit = AuditLog::query()->sole();
    expect($audit->action)->toBe('settings.updated')
        ->and($audit->user_id)->toBe($admin->id)
        ->and($audit->subject_type)->toBe((new Setting)->getMorphClass())
        ->and($audit->subject_id)->toBe(Setting::SINGLETON_ID)
        ->and($audit->ip)->toBe('203.0.113.9')
        ->and(withSortedKeys($audit->before))->toBe(withSortedKeys(settingsPayload(['worker_allowed_networks' => []])))
        ->and(withSortedKeys($audit->after))->toBe(withSortedKeys($payload));
});

it('returns 403 and changes nothing when a worker updates the settings', function (): void {
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')->putJson(route('settings.update'), settingsPayload());

    $response->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
    $this->assertDatabaseCount('audit_logs', 0);
});

it('accepts boundary values of every rule', function (array $overrides): void {
    $admin = User::factory()->admin()->create();
    $payload = settingsPayload($overrides);

    $response = $this->actingAs($admin, 'web')->putJson(route('settings.update'), $payload);

    $response->assertOk()->assertExactJson(['data' => $payload]);
})->with([
    'earliest shift start and latest shift end' => [['shift_start' => '00:00', 'shift_end' => '23:59', 'breaks' => []]],
    'breaks touching each other' => [['breaks' => [['start' => '09:00', 'end' => '09:30'], ['start' => '09:30', 'end' => '10:00']]]],
    'break spanning the whole shift' => [['breaks' => [['start' => '06:00', 'end' => '14:00']]]],
    'no backdating' => [['worker_backdate_days' => 0]],
    'one minute idle logout' => [['station_idle_logout_minutes' => 1]],
    'one minute shift' => [['shift_start' => '06:00', 'shift_end' => '06:01', 'breaks' => []]],
    'breaks sent out of order' => [['breaks' => [['start' => '12:00', 'end' => '12:30'], ['start' => '09:00', 'end' => '09:30']]]],
    'one network while the restriction is on' => [['worker_network_restriction_enabled' => true, 'worker_allowed_networks' => ['fd00::/8']]],
]);

it('returns 422 and saves nothing when a rule is broken', function (array $overrides, string $errorKey): void {
    $admin = User::factory()->admin()->create();
    $settingsBefore = resolve(SettingsRepository::class)->current()->toArray();

    $response = $this->actingAs($admin, 'web')->putJson(route('settings.update'), settingsPayload($overrides));

    $response->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_FAILED')
        ->assertJsonValidationErrors([$errorKey]);
    expect(resolve(SettingsRepository::class)->current()->toArray())->toBe($settingsBefore);
    $this->assertDatabaseCount('audit_logs', 0);
})->with([
    'shift start without leading zero' => [['shift_start' => '6:00'], 'shift_start'],
    'shift end equal to start' => [['shift_end' => '06:00', 'breaks' => []], 'shift_end'],
    'six breaks' => [['breaks' => breaksEveryTenMinutes(6)], 'breaks'],
    'break ending when it starts' => [['breaks' => [['start' => '10:00', 'end' => '10:00']]], 'breaks.0.end'],
    'break starting before the shift' => [['breaks' => [['start' => '05:59', 'end' => '06:30']]], 'breaks.0.start'],
    'break ending after the shift' => [['breaks' => [['start' => '13:30', 'end' => '14:01']]], 'breaks.0.end'],
    'second break overlapping the first' => [['breaks' => [['start' => '10:00', 'end' => '10:30'], ['start' => '10:29', 'end' => '10:45']]], 'breaks.1.start'],
    'overlapping breaks sent out of order' => [['breaks' => [['start' => '11:00', 'end' => '11:30'], ['start' => '10:45', 'end' => '11:15']]], 'breaks.0.start'],
    'backdate days negative' => [['worker_backdate_days' => -1], 'worker_backdate_days'],
    'idle logout zero' => [['station_idle_logout_minutes' => 0], 'station_idle_logout_minutes'],
    'backdate days above five' => [['worker_backdate_days' => 6], 'worker_backdate_days'],
    'idle logout above sixty' => [['station_idle_logout_minutes' => 61], 'station_idle_logout_minutes'],
    'twenty one networks' => [['worker_allowed_networks' => networkRanges(21)], 'worker_allowed_networks'],
    'restriction enabled without networks' => [['worker_network_restriction_enabled' => true, 'worker_allowed_networks' => []], 'worker_allowed_networks'],
    'network that is not an address' => [['worker_allowed_networks' => ['10.0.0.0/8', 'office']], 'worker_allowed_networks.1'],
    'duplicated network' => [['worker_allowed_networks' => ['10.0.0.0/8', '192.168.1.0/24', '10.0.0.0/8']], 'worker_allowed_networks.2'],
    'IPv4 range covering every address' => [['worker_allowed_networks' => ['0.0.0.0/0']], 'worker_allowed_networks.0'],
]);

it('returns 422 naming every required field when the payload is empty', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->putJson(route('settings.update'), []);

    $response->assertUnprocessable()->assertJsonValidationErrors(array_keys(settingsPayload()));
});

it('returns 422 naming every field when all of them have the wrong type', function (): void {
    $admin = User::factory()->admin()->create();
    $payload = [
        'shift_start' => 600,
        'shift_end' => 1400,
        'breaks' => 'lunch',
        'deduct_breaks' => 'maybe',
        'auto_pause_enabled' => 'maybe',
        'worker_backdate_days' => 'two',
        'station_idle_logout_minutes' => 'five',
        'worker_network_restriction_enabled' => 'maybe',
        'worker_allowed_networks' => '10.0.0.0/8',
    ];

    $response = $this->actingAs($admin, 'web')->putJson(route('settings.update'), $payload);

    $response->assertUnprocessable()->assertJsonValidationErrors(array_keys($payload));
});

it('reports the broken rule in Polish with the contract field key', function (): void {
    $admin = User::factory()->admin()->create();
    $payload = settingsPayload(['breaks' => [['start' => '10:00', 'end' => '10:30'], ['start' => '10:15', 'end' => '10:45']]]);

    $response = $this->actingAs($admin, 'web')->putJson(route('settings.update'), $payload);

    $response->assertUnprocessable()->assertExactJson([
        'message' => 'Dane są nieprawidłowe.',
        'code' => 'VALIDATION_FAILED',
        'errors' => ['breaks.1.start' => ['Przerwy nie mogą się nakładać.']],
    ]);
});

it('records the state locked in the database as the audit before value, not a copy read earlier in the request', function (): void {
    $admin = User::factory()->admin()->create();
    $repository = resolve(SettingsRepository::class);
    $repository->current();
    Setting::query()->update(['worker_backdate_days' => 4]);

    $this->actingAs($admin, 'web')->putJson(route('settings.update'), settingsPayload(['worker_backdate_days' => 1]))->assertOk();

    expect(AuditLog::query()->sole()->before['worker_backdate_days'])->toBe(4);
});
