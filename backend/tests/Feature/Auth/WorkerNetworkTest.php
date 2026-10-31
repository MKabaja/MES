<?php

declare(strict_types=1);

use App\Domain\ValueObjects\PlantSettings;
use App\Models\User;
use App\Repositories\SettingsRepository;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

/**
 * @param  list<string>  $networks
 */
function restrictWorkersToNetworks(array $networks): void
{
    $repository = resolve(SettingsRepository::class);
    $current = $repository->current();

    $repository->save(new PlantSettings(
        shiftStart: $current->shiftStart,
        shiftEnd: $current->shiftEnd,
        breaks: $current->breaks,
        deductBreaks: $current->deductBreaks,
        autoPauseEnabled: $current->autoPauseEnabled,
        workerBackdateDays: $current->workerBackdateDays,
        stationIdleLogoutMinutes: $current->stationIdleLogoutMinutes,
        workerNetworkRestrictionEnabled: true,
        workerAllowedNetworks: $networks,
    ));
}

it('returns 403 NETWORK_NOT_ALLOWED when a worker logs in from outside the allowed networks', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    User::factory()->worker()->create(['login' => 'Jkowal']);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertForbidden()->assertExactJson([
        'message' => 'Dostęp z tej sieci jest niedozwolony.',
        'code' => 'NETWORK_NOT_ALLOWED',
    ]);
    $this->assertGuest('web');
});

it('signs a worker in from an allowed network', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->create(['login' => 'Jkowal']);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.20'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $worker->id);
    $this->assertAuthenticatedAs($worker, 'web');
});

it('signs an admin in from outside the allowed networks', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $admin = User::factory()->admin()->create(['login' => 'Biuro']);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
        ->postJson(route('auth.login'), ['login' => 'Biuro', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $admin->id);
});

it('reports wrong credentials and a disabled account before the network', function (string $password, bool $isActive, int $status, string $code): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    User::factory()->worker()->create(['login' => 'Jkowal', 'is_active' => $isActive]);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => $password]);

    $response->assertStatus($status)->assertJsonPath('code', $code);
    $this->assertGuest('web');
})->with([
    'wrong password' => ['wrong-password', true, 422, 'INVALID_CREDENTIALS'],
    'disabled account' => ['password', false, 403, 'ACCOUNT_INACTIVE'],
]);

it('reports a disabled account before the network on a protected route', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->inactive()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
        ->getJson(route('auth.me'));

    $response->assertForbidden()->assertJsonPath('code', 'ACCOUNT_INACTIVE');
    $this->assertGuest('web');
});

it('lets a worker outside the allowed networks sign out but not read the profile', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->create();
    $this->actingAs($worker, 'web')->withServerVariables(['REMOTE_ADDR' => '10.0.0.7']);

    $profileResponse = $this->getJson(route('auth.me'));
    $logoutResponse = $this->postJson(route('auth.logout'));

    $profileResponse->assertForbidden()->assertJsonPath('code', 'NETWORK_NOT_ALLOWED');
    $logoutResponse->assertNoContent();
    $this->assertGuest('web');
});

it('returns 403 NETWORK_NOT_ALLOWED when a signed-in worker sends a request from outside the allowed networks', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
        ->getJson(route('auth.me'));

    $response->assertForbidden()->assertJsonPath('code', 'NETWORK_NOT_ALLOWED');
});

it('serves a signed-in admin from outside the allowed networks', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
        ->getJson(route('auth.me'));

    $response->assertOk()->assertJsonPath('data.id', $admin->id);
});

it('serves a worker from any address while the restriction is disabled', function (): void {
    $worker = User::factory()->worker()->create(['login' => 'Jkowal']);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.9'])
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $worker->id);
});

it('serves a worker whose address matches an allowed IPv4 or IPv6 address or range', function (string $network, string $ip): void {
    restrictWorkersToNetworks(['172.16.0.0/12', $network]);
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => $ip])
        ->getJson(route('auth.me'));

    $response->assertOk();
})->with([
    'IPv4 inside CIDR' => ['192.168.1.0/24', '192.168.1.254'],
    'exact IPv4 address' => ['10.0.0.5', '10.0.0.5'],
    'IPv6 inside CIDR' => ['2001:db8::/32', '2001:db8:abcd::1'],
    'exact IPv6 address' => ['fd00::10', 'fd00::10'],
    'IPv4-mapped IPv6 inside IPv4 CIDR' => ['192.168.1.0/24', '::ffff:192.168.1.20'],
    'IPv4-mapped IPv6 matching exact IPv4' => ['10.0.0.5', '::ffff:10.0.0.5'],
]);

it('rejects a worker whose address matches no allowed IPv4 or IPv6 address or range', function (string $network, string $ip): void {
    restrictWorkersToNetworks(['172.16.0.0/12', $network]);
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => $ip])
        ->getJson(route('auth.me'));

    $response->assertForbidden()->assertJsonPath('code', 'NETWORK_NOT_ALLOWED');
})->with([
    'IPv4 outside CIDR' => ['192.168.1.0/24', '192.168.2.1'],
    'other IPv4 address' => ['10.0.0.5', '10.0.0.6'],
    'IPv6 outside CIDR' => ['2001:db8::/32', '2001:db9::1'],
    'other IPv6 address' => ['fd00::10', 'fd00::11'],
    'IPv4-mapped IPv6 outside IPv4 CIDR' => ['192.168.1.0/24', '::ffff:192.168.2.1'],
]);

it('takes the worker address from X-Forwarded-For sent by a trusted proxy', function (): void {
    config(['trustedproxy.proxies' => '10.10.0.1']);
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '10.10.0.1'])
        ->withHeader('X-Forwarded-For', '192.168.1.20')
        ->getJson(route('auth.me'));

    $response->assertOk();
});

it('ignores X-Forwarded-For when no trusted proxy is configured', function (): void {
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '10.10.0.1'])
        ->withHeader('X-Forwarded-For', '192.168.1.20')
        ->getJson(route('auth.me'));

    $response->assertForbidden()->assertJsonPath('code', 'NETWORK_NOT_ALLOWED');
});

it('ignores X-Forwarded-For sent by an address that is not a trusted proxy', function (): void {
    config(['trustedproxy.proxies' => '10.10.0.2']);
    restrictWorkersToNetworks(['192.168.1.0/24']);
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '10.10.0.1'])
        ->withHeader('X-Forwarded-For', '192.168.1.20')
        ->getJson(route('auth.me'));

    $response->assertForbidden()->assertJsonPath('code', 'NETWORK_NOT_ALLOWED');
});

it('signs a worker in through a trusted proxy only when X-Forwarded-For lies in an allowed network', function (string $forwardedIp, int $status): void {
    config(['trustedproxy.proxies' => '10.10.0.1']);
    restrictWorkersToNetworks(['192.168.1.0/24']);
    User::factory()->worker()->create(['login' => 'Jkowal']);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '10.10.0.1'])
        ->withHeader('X-Forwarded-For', $forwardedIp)
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertStatus($status);
})->with([
    'forwarded address inside the network' => ['192.168.1.20', 200],
    'forwarded address outside the network' => ['10.0.0.7', 403],
]);
