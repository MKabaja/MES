<?php

declare(strict_types=1);

use App\Models\User;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('returns the signed-in user', function (): void {
    $user = User::factory()->admin()->create();

    $response = $this->actingAs($user, 'web')->getJson(route('auth.me'));

    $response->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.remember_token');
});

it('returns 401 without a session', function (): void {
    $response = $this->getJson(route('auth.me'));

    $response->assertUnauthorized()->assertExactJson([
        'message' => 'Brak aktywnej sesji. Zaloguj się.',
        'code' => 'UNAUTHENTICATED',
    ]);
});
