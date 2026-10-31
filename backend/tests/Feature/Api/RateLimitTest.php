<?php

declare(strict_types=1);

use App\Models\User;

use function Pest\Laravel\freezeTime;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('returns 429 on the 121st authenticated request within a minute', function (): void {
    freezeTime();
    $admin = User::factory()->admin()->create();
    foreach (range(1, 120) as $request) {
        $this->actingAs($admin, 'web')->getJson(route('auth.me'))->assertOk();
    }

    $response = $this->actingAs($admin, 'web')->getJson(route('auth.me'));

    $response->assertTooManyRequests()
        ->assertHeader('Retry-After', '60')
        ->assertExactJson([
            'message' => 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
            'code' => 'TOO_MANY_REQUESTS',
        ]);
});
