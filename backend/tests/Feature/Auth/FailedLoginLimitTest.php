<?php

declare(strict_types=1);

use App\Models\User;

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
