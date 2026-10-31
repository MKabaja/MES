<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Exceptions;

it('returns 403 FORBIDDEN without reporting when signing in from outside the SPA', function (): void {
    Exceptions::fake();
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertForbidden()->assertExactJson([
        'message' => 'Brak uprawnień do wykonania tej operacji.',
        'code' => 'FORBIDDEN',
    ]);
    $this->assertGuest('web');
    Exceptions::assertNothingReported();
});

it('ignores a bearer token and returns 401 UNAUTHENTICATED without a session', function (): void {
    Exceptions::fake();
    User::factory()->create();

    $response = $this->withHeader('Authorization', 'Bearer 1|abc')->getJson(route('auth.me'));

    $response->assertUnauthorized()->assertExactJson([
        'message' => 'Brak aktywnej sesji. Zaloguj się.',
        'code' => 'UNAUTHENTICATED',
    ]);
    Exceptions::assertNothingReported();
});

it('keeps the session user when a bearer token is also sent', function (): void {
    Exceptions::fake();
    $user = User::factory()->create(['login' => 'Jkowal']);
    $this->withHeader('Origin', 'http://localhost:5173')
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])
        ->assertOk();
    app('auth')->forgetGuards();

    $response = $this->withHeader('Authorization', 'Bearer 1|abc')->getJson(route('auth.me'));

    $response->assertOk()->assertJsonPath('data.id', $user->id);
    Exceptions::assertNothingReported();
});
