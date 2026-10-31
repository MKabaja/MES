<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Contracts\Hashing\Hasher;

use function Pest\Laravel\freezeTime;
use function Pest\Laravel\travelTo;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

it('signs the user in and returns the user', function (): void {
    travelTo('2026-10-28 06:00:00');
    $user = User::factory()->worker()->create([
        'first_name' => 'Jan',
        'last_name' => 'Kowalski',
        'login' => 'Jkowal',
    ]);

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk()->assertExactJson([
        'data' => [
            'id' => $user->id,
            'first_name' => 'Jan',
            'last_name' => 'Kowalski',
            'full_name' => 'Jan Kowalski',
            'login' => 'Jkowal',
            'role' => 'worker',
            'is_active' => true,
            'created_at' => '2026-10-28T06:00:00Z',
        ],
    ]);
    $this->assertAuthenticatedAs($user, 'web');
});

it('keeps the user signed in on the next request through the session', function (): void {
    $user = User::factory()->create(['login' => 'Jkowal']);
    $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])->assertOk();
    app('auth')->forgetGuards();

    $response = $this->getJson(route('auth.me'));

    $response->assertOk()->assertJsonPath('data.id', $user->id);
});

it('signs the user in regardless of the letter case of the login', function (): void {
    $user = User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), ['login' => 'JKOWAL', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $user->id);
    $this->assertAuthenticatedAs($user, 'web');
});

it('returns 422 with the same error for an unknown login and a wrong password', function (array $credentials): void {
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), $credentials);

    $response->assertUnprocessable()->assertExactJson([
        'message' => 'Nieprawidłowy login lub hasło.',
        'code' => 'INVALID_CREDENTIALS',
        'errors' => ['login' => ['Nieprawidłowy login lub hasło.']],
    ]);
    $this->assertGuest('web');
})->with([
    'unknown login' => [['login' => 'Anowak', 'password' => 'password']],
    'wrong password' => [['login' => 'Jkowal', 'password' => 'wrong-password']],
]);

it('still checks a password hash when the login does not exist', function (): void {
    $hasher = $this->spy(Hasher::class);
    $hasher->shouldReceive('make')->andReturn('dummy-hash');

    $response = $this->postJson(route('auth.login'), ['login' => 'Anowak', 'password' => 'password']);

    $response->assertUnprocessable()->assertJsonPath('code', 'INVALID_CREDENTIALS');
    $hasher->shouldHaveReceived('check')->once()->with('password', Mockery::type('string'));
});

it('issues a new session ID on login', function (): void {
    User::factory()->create(['login' => 'Jkowal']);
    $this->withSession(['visited' => true]);
    $sessionIdBeforeLogin = session()->getId();

    $response = $this->withCredentials()->withCookie(config('session.cookie'), $sessionIdBeforeLogin)
        ->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
    expect(session()->getId())->toBeString()->not->toBe($sessionIdBeforeLogin);
});

it('replaces the session of a signed-in user who logs in as someone else', function (): void {
    User::factory()->create(['login' => 'Jkowal']);
    $otherUser = User::factory()->create(['login' => 'Anowak']);
    $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])->assertOk();
    $sessionIdOfFirstLogin = session()->getId();

    $response = $this->withCredentials()->withCookie(config('session.cookie'), $sessionIdOfFirstLogin)
        ->postJson(route('auth.login'), ['login' => 'Anowak', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $otherUser->id);
    expect(session()->getId())->not->toBe($sessionIdOfFirstLogin);
    app('auth')->forgetGuards();
    $this->getJson(route('auth.me'))->assertOk()->assertJsonPath('data.id', $otherUser->id);
});

it('returns 403 ACCOUNT_INACTIVE when the password of a disabled account is correct', function (): void {
    User::factory()->inactive()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertForbidden()->assertExactJson([
        'message' => 'Konto jest nieaktywne.',
        'code' => 'ACCOUNT_INACTIVE',
    ]);
    $this->assertGuest('web');
});

it('returns 422 INVALID_CREDENTIALS for a disabled account with a wrong password', function (): void {
    User::factory()->inactive()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'wrong-password']);

    $response->assertUnprocessable()->assertJsonPath('code', 'INVALID_CREDENTIALS');
    $this->assertGuest('web');
});

it('returns 422 with named fields when the credentials are missing', function (string $locale, array $errors): void {
    $response = $this->postJson(route('auth.login'), [], ['Accept-Language' => $locale]);

    $response->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_FAILED')
        ->assertJsonPath('errors', $errors);
})->with([
    'polish' => ['pl', ['login' => ['Pole login jest wymagane.'], 'password' => ['Pole hasło jest wymagane.']]],
    'english' => ['en', ['login' => ['The login field is required.'], 'password' => ['The password field is required.']]],
]);

it('returns 422 when the credentials are not strings', function (): void {
    $response = $this->postJson(route('auth.login'), ['login' => ['Jkowal'], 'password' => ['password']]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['login', 'password']);
});

it('returns 429 on the sixth attempt within a minute for the same login and IP', function (): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'wrong-password']);
    }

    $response = $this->postJson(route('auth.login'), ['login' => 'jkowal', 'password' => 'password']);

    $response->assertTooManyRequests()
        ->assertHeader('Retry-After', '60')
        ->assertExactJson([
            'message' => 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
            'code' => 'TOO_MANY_REQUESTS',
        ]);
    $this->assertGuest('web');
});

it('keeps the limit separate for another login and for another IP', function (string $login, string $ip): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    User::factory()->create(['login' => 'Anowak']);
    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'wrong-password']);
    }

    $response = $this->withServerVariables(['REMOTE_ADDR' => $ip])
        ->postJson(route('auth.login'), ['login' => $login, 'password' => 'password']);

    $response->assertOk();
})->with([
    'another login' => ['Anowak', '127.0.0.1'],
    'another IP' => ['Jkowal', '10.0.0.2'],
]);
