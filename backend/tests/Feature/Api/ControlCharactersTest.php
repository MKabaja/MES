<?php

declare(strict_types=1);

use App\Models\User;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('returns 400 BAD_REQUEST when the query string contains a NUL byte', function (): void {
    $response = $this->getJson('/api/v1/auth/me?search=Jan%00Kowalski');

    $response->assertBadRequest()->assertExactJson([
        'message' => 'Niepoprawne żądanie.',
        'code' => 'BAD_REQUEST',
    ]);
});

it('returns 400 BAD_REQUEST when a nested body value contains a control character', function (string $controlCharacter): void {
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), [
        'login' => 'Jkowal',
        'password' => 'password',
        'details' => ['notes' => ['line', "Jkowal{$controlCharacter}x"]],
    ]);

    $response->assertBadRequest()->assertExactJson([
        'message' => 'Niepoprawne żądanie.',
        'code' => 'BAD_REQUEST',
    ]);
    $this->assertGuest('web');
})->with([
    'NUL' => ["\0"],
    'unit separator' => ["\x1F"],
    'vertical tab' => ["\x0B"],
]);

it('returns 400 BAD_REQUEST when a body key contains a NUL byte', function (): void {
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), [
        'login' => 'Jkowal',
        'password' => 'password',
        'details' => ["note\0" => 'text'],
    ]);

    $response->assertBadRequest()->assertJsonPath('code', 'BAD_REQUEST');
    $this->assertGuest('web');
});

it('accepts tab, line feed and carriage return in input values', function (): void {
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), [
        'login' => 'Jkowal',
        'password' => 'password',
        'note' => "first\tline\r\nsecond line\n",
    ]);

    $response->assertOk();
});

it('adds CORS headers to the 400 response for an allowed origin', function (): void {
    $response = $this->postJson(route('auth.login'), ['login' => "Jkowal\0", 'password' => 'password']);

    $response->assertBadRequest()->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
});
