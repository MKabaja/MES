<?php

declare(strict_types=1);

use App\Models\User;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('lists only active workers with the contract shape and a null current segment', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->create(['first_name' => 'Jan', 'last_name' => 'Kowalski', 'login' => 'Jkowal']);
    User::factory()->inactive()->create();

    $response = $this->actingAs($admin, 'web')->getJson(route('users.index'));

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('meta', ['current_page' => 1, 'per_page' => 25, 'total' => 1, 'last_page' => 1])
        ->assertJsonPath('data.0', [
            'id' => $worker->id,
            'first_name' => 'Jan',
            'last_name' => 'Kowalski',
            'full_name' => 'Jan Kowalski',
            'login' => 'Jkowal',
            'role' => 'worker',
            'is_active' => true,
            'created_at' => $worker->created_at?->toIso8601ZuluString(),
            'current_segment' => null,
        ]);
});

it('filters by status', function (string $status, array $expectedLogins): void {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['login' => 'Active1']);
    User::factory()->inactive()->create(['login' => 'Inact1']);

    $response = $this->actingAs($admin, 'web')->getJson(route('users.index', ['status' => $status]));

    $response->assertOk();
    expect(collect($response->json('data'))->pluck('login')->sort()->values()->all())->toBe($expectedLogins);
})->with([
    'active' => ['active', ['Active1']],
    'inactive' => ['inactive', ['Inact1']],
    'all workers without admins' => ['all', ['Active1', 'Inact1']],
]);

it('returns 422 for an unknown status', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->getJson(route('users.index', ['status' => 'deleted']));

    $response->assertUnprocessable()->assertJsonValidationErrors(['status']);
});

it('searches names and logins case-insensitively and treats percent and underscore literally', function (string $search, array $expectedLogins): void {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['first_name' => 'Jan', 'last_name' => 'Kowalski', 'login' => 'Jkowal']);
    User::factory()->create(['first_name' => 'Anna', 'last_name' => 'Nowak', 'login' => 'Anowak']);
    User::factory()->create(['first_name' => '100%', 'last_name' => 'Under_score', 'login' => 'Punct']);

    $response = $this->actingAs($admin, 'web')->getJson(route('users.index', ['search' => $search]));

    $response->assertOk();
    expect(collect($response->json('data'))->pluck('login')->sort()->values()->all())->toBe($expectedLogins);
})->with([
    'part of a first name' => ['jAN', ['Jkowal']],
    'part of a surname' => ['nowa', ['Anowak']],
    'part of a login' => ['kowal', ['Jkowal']],
    'percent is not a wildcard' => ['%', ['Punct']],
    'underscore is not a wildcard' => ['rxs', []],
    'literal underscore' => ['r_s', ['Punct']],
    'underscore does not match a letter' => ['J_n', []],
    'backslash is literal' => ['a\\n', []],
    'backslash before a wildcard' => ['\\%', []],
]);

it('paginates ordered by surname', function (): void {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['last_name' => 'Cebula']);
    User::factory()->create(['last_name' => 'Adamski']);
    User::factory()->create(['last_name' => 'Bielak']);

    $response = $this->actingAs($admin, 'web')->getJson(route('users.index', ['per_page' => 2, 'page' => 2]));

    $response->assertOk()
        ->assertJsonPath('meta', ['current_page' => 2, 'per_page' => 2, 'total' => 3, 'last_page' => 2])
        ->assertJsonPath('data.0.last_name', 'Cebula');
});

it('returns 403 when a worker lists accounts', function (): void {
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')->getJson(route('users.index'));

    $response->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
});

it('lists active workers sorted by surname with the login visible only to the admin', function (string $role): void {
    $caller = User::factory()->{$role}()->create(['first_name' => 'Ewa', 'last_name' => 'Zielińska', 'login' => 'Ezieli']);
    $kowalski = User::factory()->create(['first_name' => 'Jan', 'last_name' => 'Kowalski', 'login' => 'Jkowal']);
    $adamski = User::factory()->create(['first_name' => 'Zenon', 'last_name' => 'Adamski', 'login' => 'Zadams']);
    User::factory()->inactive()->create();
    $loginOf = fn (string $login): array => $role === 'admin' ? ['login' => $login] : [];

    $response = $this->actingAs($caller, 'web')->getJson(route('workers.index'));

    $response->assertOk()->assertExactJson(['data' => [
        ['id' => $adamski->id, 'full_name' => 'Zenon Adamski', ...$loginOf('Zadams')],
        ['id' => $kowalski->id, 'full_name' => 'Jan Kowalski', ...$loginOf('Jkowal')],
        ...($role === 'worker' ? [['id' => $caller->id, 'full_name' => 'Ewa Zielińska', ...$loginOf('Ezieli')]] : []),
    ]]);
})->with(['admin', 'worker']);

it('sorts surnames by Polish collation regardless of letter case', function (): void {
    $admin = User::factory()->admin()->create();
    foreach (['Zając', 'Łoś', 'cebula', 'Mak', 'Ćwik', 'Dąb', 'Lis'] as $lastName) {
        User::factory()->create(['last_name' => $lastName]);
    }

    $response = $this->actingAs($admin, 'web')->getJson(route('users.index'));

    expect($response->json('data.*.last_name'))->toBe(['cebula', 'Ćwik', 'Dąb', 'Lis', 'Łoś', 'Mak', 'Zając']);
});
