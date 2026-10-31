<?php

declare(strict_types=1);

use App\Domain\Enums\Role;
use App\Models\User;
use App\Support\Console\StandardInput;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

const ADMIN_PASSWORD = 'correct horse battery';

function feedStandardInput(?string $line): void
{
    test()->mock(StandardInput::class, fn ($mock) => $mock->shouldReceive('readLine')->andReturn($line));
}

it('creates an office account from interactive answers', function (): void {
    $this->artisan('mes:create-admin')
        ->expectsQuestion('Imię', ' Anna ')
        ->expectsQuestion('Nazwisko', 'Nowak')
        ->expectsQuestion('Login', 'anowak')
        ->expectsQuestion('Hasło', ADMIN_PASSWORD)
        ->expectsQuestion('Powtórz hasło', ADMIN_PASSWORD)
        ->expectsOutputToContain('Utworzono konto biura z loginem anowak.')
        ->assertSuccessful();

    $admin = User::query()->where('login', 'anowak')->firstOrFail();
    expect($admin->role)->toBe(Role::Admin)
        ->and($admin->first_name)->toBe('Anna')
        ->and($admin->last_name)->toBe('Nowak')
        ->and($admin->is_active)->toBeTrue()
        ->and(Hash::check(ADMIN_PASSWORD, $admin->password))->toBeTrue();
});

it('creates an office account with the password read from standard input', function (): void {
    feedStandardInput(ADMIN_PASSWORD);

    $this->artisan('mes:create-admin', [
        '--first-name' => 'Anna',
        '--last-name' => 'Nowak',
        '--login' => 'anowak',
        '--password-stdin' => true,
        '--no-interaction' => true,
    ])->assertSuccessful();

    expect(Hash::check(ADMIN_PASSWORD, User::query()->where('login', 'anowak')->firstOrFail()->password))->toBeTrue();
});

it('refuses to run non-interactively without the password on standard input', function (): void {
    $this->artisan('mes:create-admin', [
        '--first-name' => 'Anna',
        '--last-name' => 'Nowak',
        '--login' => 'anowak',
        '--no-interaction' => true,
    ])->assertFailed();

    expect(User::query()->count())->toBe(0);
});

it('rejects a login taken by a worker in another letter case', function (): void {
    User::factory()->worker()->create(['login' => 'Jkowal']);
    feedStandardInput(ADMIN_PASSWORD);

    $this->artisan('mes:create-admin', [
        '--first-name' => 'Jan',
        '--last-name' => 'Kowalski',
        '--login' => 'jKOWAL',
        '--password-stdin' => true,
    ])
        ->expectsOutputToContain('Wartość pola login jest już zajęta.')
        ->assertFailed();

    expect(User::query()->count())->toBe(1);
});

function runWithStdin(string $password, string $login = 'anowak'): int
{
    feedStandardInput($password);

    return Artisan::call('mes:create-admin', [
        '--first-name' => 'Anna',
        '--last-name' => 'Nowak',
        '--login' => $login,
        '--password-stdin' => true,
    ]);
}

it('accepts passwords of 12 to 64 characters only', function (int $length, bool $isAccepted): void {
    $exitCode = runWithStdin(str_repeat('a', $length));

    expect($exitCode === 0)->toBe($isAccepted)
        ->and(User::query()->count())->toBe($isAccepted ? 1 : 0);
})->with([
    'too short' => [11, false],
    'shortest' => [12, true],
    'longest' => [64, true],
    'too long' => [65, false],
]);

it('accepts or rejects logins by length and characters', function (string $login, bool $isAccepted): void {
    $exitCode = runWithStdin(ADMIN_PASSWORD, $login);

    expect($exitCode === 0)->toBe($isAccepted);
})->with([
    'space' => ['an owak', false],
    'tab' => ["an\towak", false],
    'no-break space' => ["an\u{00A0}owak", false],
    'zero width space' => ["an\u{200B}owak", false],
    'control character' => ["an\x07owak", false],
    'two characters' => ['an', false],
    'thirty-one characters' => [str_repeat('a', 31), false],
    'three characters' => ['ann', true],
    'thirty characters' => [str_repeat('a', 30), true],
    'polish letters' => ['Żółw_ąę', true],
]);

it('fails when standard input is empty', function (): void {
    feedStandardInput(null);

    $this->artisan('mes:create-admin', [
        '--first-name' => 'Anna',
        '--last-name' => 'Nowak',
        '--login' => 'anowak',
        '--password-stdin' => true,
    ])
        ->expectsOutputToContain('Nie odczytano hasła ze standardowego wejścia.')
        ->assertFailed();

    expect(User::query()->count())->toBe(0);
});

it('refuses to run non-interactively without the login', function (): void {
    feedStandardInput(ADMIN_PASSWORD);

    $this->artisan('mes:create-admin', [
        '--first-name' => 'Anna',
        '--last-name' => 'Nowak',
        '--password-stdin' => true,
        '--no-interaction' => true,
    ])->assertFailed();

    expect(User::query()->count())->toBe(0);
});

it('rejects a password confirmation that differs from the password', function (): void {
    $this->artisan('mes:create-admin')
        ->expectsQuestion('Imię', 'Anna')
        ->expectsQuestion('Nazwisko', 'Nowak')
        ->expectsQuestion('Login', 'anowak')
        ->expectsQuestion('Hasło', ADMIN_PASSWORD)
        ->expectsQuestion('Powtórz hasło', 'something else entirely')
        ->assertFailed();

    expect(User::query()->count())->toBe(0);
});

it('never prints the password, also when validation fails', function (string $login): void {
    runWithStdin(ADMIN_PASSWORD, $login);

    expect(Artisan::output())->not->toContain(ADMIN_PASSWORD);
})->with([
    'valid login' => 'anowak',
    'invalid login' => 'a',
]);

it('creates an account that can sign in through the API', function (): void {
    feedStandardInput(ADMIN_PASSWORD);
    Artisan::call('mes:create-admin', [
        '--first-name' => 'Anna',
        '--last-name' => 'Nowak',
        '--login' => 'anowak',
        '--password-stdin' => true,
    ]);

    $this->withHeader('Origin', 'http://localhost:5173')
        ->postJson(route('auth.login'), ['login' => 'ANOWAK', 'password' => ADMIN_PASSWORD])
        ->assertOk()
        ->assertJsonPath('data.role', 'admin');
});
