<?php

declare(strict_types=1);

use App\Models\User;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('returns 403 ACCOUNT_INACTIVE and ends the session when the account is disabled during the session', function (): void {
    $user = User::factory()->worker()->create(['login' => 'Jkowal']);
    $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])->assertOk();
    session()->put('draft_order', 'ZP/1/10/2026');
    $user->update(['is_active' => false]);
    app('auth')->forgetGuards();

    $response = $this->getJson(route('auth.me'));

    $response->assertForbidden()->assertExactJson([
        'message' => 'Konto jest nieaktywne.',
        'code' => 'ACCOUNT_INACTIVE',
    ]);
    $this->assertGuest('web');
    expect(session()->has('draft_order'))->toBeFalse();
    app('auth')->forgetGuards();
    $this->getJson(route('auth.me'))->assertUnauthorized();
});

it('returns 403 ACCOUNT_INACTIVE when a disabled user tries to sign out', function (): void {
    $user = User::factory()->admin()->inactive()->create();

    $response = $this->actingAs($user, 'web')->postJson(route('auth.logout'));

    $response->assertForbidden()->assertJsonPath('code', 'ACCOUNT_INACTIVE');
    $this->assertGuest('web');
});
