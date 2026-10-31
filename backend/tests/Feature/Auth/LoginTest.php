<?php

declare(strict_types=1);

use App\Models\User;
use App\Support\Auth\DummyPasswordHash;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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

it('signs the user in regardless of the letter case of the login', function (): void {
    $user = User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), ['login' => 'JKOWAL', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $user->id);
    $this->assertAuthenticatedAs($user, 'web');
});

it('matches non-ASCII logins regardless of letter case in the database', function (): void {
    $user = User::factory()->admin()->create(['login' => 'Żółw']);

    $response = $this->postJson(route('auth.login'), ['login' => 'żÓŁW', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $user->id);
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

it('checks the password against the cached dummy hash without hashing when the login does not exist', function (): void {
    $dummyHash = app(DummyPasswordHash::class)->value();
    $hasher = $this->spy(Hasher::class);

    $response = $this->postJson(route('auth.login'), ['login' => 'Anowak', 'password' => 'password']);

    $response->assertUnprocessable()->assertJsonPath('code', 'INVALID_CREDENTIALS');
    $hasher->shouldHaveReceived('check')->once()->with('password', $dummyHash);
    $hasher->shouldNotHaveReceived('make');
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

it('returns 422 with named fields when the credentials are missing', function (): void {
    $response = $this->postJson(route('auth.login'), []);

    $response->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_FAILED')
        ->assertJsonPath('errors', ['login' => ['Pole login jest wymagane.'], 'password' => ['Pole hasło jest wymagane.']]);
});

it('returns 422 when the login or password is longer than allowed', function (array $credentials, string $field): void {
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), $credentials);

    $response->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_FAILED')
        ->assertOnlyJsonValidationErrors([$field]);
})->with([
    'login of 31 characters' => [['login' => str_repeat('a', 31), 'password' => 'password'], 'login'],
    'password of 65 characters' => [['login' => 'Jkowal', 'password' => str_repeat('a', 65)], 'password'],
]);

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

it('returns 400 instead of signing in when NUL bytes vary the login to bypass the limit', function (): void {
    freezeTime();
    User::factory()->create(['login' => 'Jkowal']);
    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('auth.login'), ['login' => "Jkowal\0{$attempt}", 'password' => 'wrong-password'])
            ->assertBadRequest();
    }

    $response = $this->postJson(route('auth.login'), ['login' => "Jkowal\x006", 'password' => 'password']);

    $response->assertBadRequest()->assertJsonPath('code', 'BAD_REQUEST');
    $this->assertGuest('web');
});

it('destroys the previous session record when another user logs in on the same browser', function (): void {
    config(['session.driver' => 'database']);
    User::factory()->create(['login' => 'Jkowal']);
    $otherUser = User::factory()->create(['login' => 'Anowak']);
    $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])->assertOk();
    $sessionIdOfFirstLogin = session()->getId();
    $this->assertDatabaseHas('sessions', ['id' => $sessionIdOfFirstLogin]);

    $response = $this->withCredentials()->withCookie(config('session.cookie'), $sessionIdOfFirstLogin)
        ->postJson(route('auth.login'), ['login' => 'Anowak', 'password' => 'password']);

    $response->assertOk()->assertJsonPath('data.id', $otherUser->id);
    $this->assertAuthenticatedAs($otherUser, 'web');
    $this->assertDatabaseMissing('sessions', ['id' => $sessionIdOfFirstLogin]);
    app('auth')->forgetGuards();
    $this->getJson(route('auth.me'))->assertOk()->assertJsonPath('data.id', $otherUser->id);
});

it('does not carry session data of the previous account over to the next login', function (): void {
    User::factory()->create(['login' => 'Anowak']);

    $response = $this->withSession(['previous_account_data' => 'secret'])
        ->postJson(route('auth.login'), ['login' => 'Anowak', 'password' => 'password']);

    $response->assertOk();
    expect(session()->has('previous_account_data'))->toBeFalse()
        ->and(session()->token())->not->toBeEmpty();
    $response->assertCookie('XSRF-TOKEN');
});

it('sends the session cookie only over HTTPS outside the local environment', function (): void {
    User::factory()->create(['login' => 'Jkowal']);

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
    expect($response->getCookie(config('session.cookie'), decrypt: false)?->isSecure())->toBeTrue();
});

it('rehashes the password with the current cost after a successful login', function (): void {
    $user = User::factory()->create(['login' => 'Jkowal']);
    DB::table('users')->where('id', $user->id)->update(['password' => Hash::make('password', ['rounds' => 5])]);

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
    $newHash = $user->fresh()->password;
    expect(password_get_info($newHash)['options'])->toBe(['cost' => 4])
        ->and(Hash::check('password', $newHash))->toBeTrue();
});

it('keeps the password hash when it already uses the current cost', function (): void {
    $user = User::factory()->create(['login' => 'Jkowal']);
    $hashBeforeLogin = $user->password;

    $response = $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password']);

    $response->assertOk();
    expect($user->fresh()->password)->toBe($hashBeforeLogin);
});

it('binds the new session to the verified password hash so a later password change signs it out', function (): void {
    $user = User::factory()->create(['login' => 'Jkowal']);
    DB::table('users')->where('id', $user->id)->update(['password' => Hash::make('password', ['rounds' => 5])]);

    $this->postJson(route('auth.login'), ['login' => 'Jkowal', 'password' => 'password'])->assertOk();

    $sessionData = session()->all();
    expect($sessionData['password_hash_web'])->toBe(auth('web')->hashPasswordForCookie($user->fresh()->password));

    DB::table('users')->where('id', $user->id)->update(['password' => Hash::make('changed-password')]);
    auth()->forgetGuards();

    $this->withSession($sessionData)->getJson(route('auth.me'))->assertUnauthorized();
});
