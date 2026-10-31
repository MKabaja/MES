<?php

declare(strict_types=1);

use App\Models\User;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('signs the user out and invalidates the session and the CSRF token', function (): void {
    User::factory()->create(['login' => 'Jkowal']);
    $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])->assertOk();
    session()->put('draft_order', 'ZP/1/10/2026');
    $tokenBeforeLogout = session()->token();

    $response = $this->postJson(route('auth.logout'));

    $response->assertNoContent();
    $this->assertGuest('web');
    expect(session()->has('draft_order'))->toBeFalse()
        ->and(session()->token())->toBeString()->not->toBe($tokenBeforeLogout);
    app('auth')->forgetGuards();
    $this->getJson(route('auth.me'))->assertUnauthorized();
});

it('returns 401 when signing out without a session', function (): void {
    $response = $this->postJson(route('auth.logout'));

    $response->assertUnauthorized()->assertJsonPath('code', 'UNAUTHENTICATED');
});
