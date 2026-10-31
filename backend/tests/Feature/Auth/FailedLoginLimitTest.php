<?php

declare(strict_types=1);

use App\Domain\ValueObjects\PlantSettings;
use App\Models\User;
use App\Repositories\SettingsRepository;

use function Pest\Laravel\freezeTime;
use function Pest\Laravel\travel;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

function failLoginsFrom(string $ip, int $attempts): void
{
    foreach (range(1, $attempts) as $attempt) {
        test()->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson(route('auth.login'), ['login' => "Worker{$attempt}", 'password' => 'wrong-password'])
            ->assertUnprocessable();
    }
}

it('returns 429 even for a correct password after 20 failed attempts on different logins from one IP', function (): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsFrom('10.0.0.5', 20);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertTooManyRequests()
        ->assertHeader('Retry-After', '60')
        ->assertExactJson([
            'message' => 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
            'code' => 'TOO_MANY_REQUESTS',
        ]);
    $this->assertGuest('web');
});

it('accepts a correct password after 19 failed attempts from one IP', function (): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsFrom('10.0.0.5', 19);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
});

it('does not block the network for successful logins of many workers', function (): void {
    freezeTime();
    $workers = User::factory()->count(30)->sequence(fn ($sequence) => ['login' => "Worker{$sequence->index}"])->create();
    foreach ($workers->take(29) as $worker) {
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
            ->postJson(route('auth.login'), ['login' => $worker->login, 'password' => 'password'])
            ->assertOk();
    }

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
        ->postJson(route('auth.login'), ['login' => $workers->last()->login, 'password' => 'password']);

    $response->assertOk();
});

it('shares the failed attempts within one network', function (string $blockedIp, string $nextIp): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsFrom($blockedIp, 20);

    $response = $this->withServerVariables(['REMOTE_ADDR' => $nextIp])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertTooManyRequests();
})->with([
    'IPv6 in the same /64' => ['2001:db8:1:1::1', '2001:db8:1:1:ffff:ffff:ffff:fffe'],
    'IPv4-mapped IPv6 of the same IPv4' => ['10.0.0.5', '::ffff:10.0.0.5'],
]);

it('keeps the failed attempts of another network separate', function (string $blockedIp, string $nextIp): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsFrom($blockedIp, 20);

    $response = $this->withServerVariables(['REMOTE_ADDR' => $nextIp])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
})->with([
    'another IPv4 address' => ['10.0.0.5', '10.0.0.6'],
    'IPv6 in another /64' => ['2001:db8:1:1::1', '2001:db8:1:2::1'],
]);

it('accepts logins again once the minute has passed', function (): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsFrom('10.0.0.5', 20);
    travel(61)->seconds();

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
});

it('does not count correct passwords of disabled accounts towards the limit', function (): void {
    freezeTime();
    $disabledWorkers = User::factory()->inactive()->count(25)->sequence(fn ($sequence) => ['login' => "Disabled{$sequence->index}"])->create();
    User::factory()->create(['login' => 'Jkowal']);
    foreach ($disabledWorkers as $disabledWorker) {
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
            ->postJson(route('auth.login'), ['login' => $disabledWorker->login, 'password' => 'password'])
            ->assertForbidden();
    }

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
});

it('does not count correct passwords of workers outside the allowed networks towards the limit', function (): void {
    freezeTime();
    $settings = resolve(SettingsRepository::class);
    $current = $settings->current();
    $settings->save(new PlantSettings(
        shiftStart: $current->shiftStart,
        shiftEnd: $current->shiftEnd,
        breaks: $current->breaks,
        deductBreaks: $current->deductBreaks,
        autoPauseEnabled: $current->autoPauseEnabled,
        workerBackdateDays: $current->workerBackdateDays,
        stationIdleLogoutMinutes: $current->stationIdleLogoutMinutes,
        workerNetworkRestrictionEnabled: true,
        workerAllowedNetworks: ['192.168.1.0/24'],
    ));
    $workers = User::factory()->worker()->count(25)->sequence(fn ($sequence) => ['login' => "Worker{$sequence->index}"])->create();
    User::factory()->admin()->create(['login' => 'Admin']);
    foreach ($workers as $worker) {
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
            ->postJson(route('auth.login'), ['login' => $worker->login, 'password' => 'password'])
            ->assertForbidden();
    }

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.5'])
        ->postJson(route('auth.login'), ['login' => 'Admin', 'password' => 'password']);

    $response->assertOk();
});

function allowHallNetwork(string $network): void
{
    $settings = resolve(SettingsRepository::class);
    $current = $settings->current();
    $settings->save(new PlantSettings(
        shiftStart: $current->shiftStart,
        shiftEnd: $current->shiftEnd,
        breaks: $current->breaks,
        deductBreaks: $current->deductBreaks,
        autoPauseEnabled: $current->autoPauseEnabled,
        workerBackdateDays: $current->workerBackdateDays,
        stationIdleLogoutMinutes: $current->stationIdleLogoutMinutes,
        workerNetworkRestrictionEnabled: false,
        workerAllowedNetworks: [$network],
    ));
}

function failLoginsOfAccountFromDifferentIps(string $login, string $ipPrefix, int $attempts): void
{
    foreach (range(1, $attempts) as $attempt) {
        test()->withServerVariables(['REMOTE_ADDR' => "{$ipPrefix}.{$attempt}"])
            ->postJson(route('auth.login'), ['login' => $login, 'password' => 'wrong-password'])
            ->assertUnprocessable();
    }
}

it('returns 429 on the eleventh failed attempt on one login from outside the hall network, even from another IP', function (): void {
    freezeTime();
    allowHallNetwork('192.168.1.0/24');
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsOfAccountFromDifferentIps('JKowal', '10.0.0', 10);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '172.16.0.1'])
        ->postJson(route('auth.login'), ['login' => 'jkowal', 'password' => 'password']);

    $response->assertTooManyRequests()->assertHeader('Retry-After', '900');
    $this->assertGuest('web');
});

it('does not lock an account because of failed attempts from the hall network', function (): void {
    freezeTime();
    allowHallNetwork('192.168.1.0/24');
    User::factory()->create(['login' => 'Jkowal']);
    failLoginsOfAccountFromDifferentIps('Jkowal', '192.168.1', 11);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.200'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
});
