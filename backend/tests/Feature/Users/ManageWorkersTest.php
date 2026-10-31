<?php

declare(strict_types=1);

use App\Domain\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

beforeEach(fn () => $this->withHeader('Origin', 'http://localhost:5173'));

function storeSession(User $user, string $suffix = ''): void
{
    DB::table('sessions')->insert([
        'id' => 'session-'.$user->id.$suffix,
        'user_id' => $user->id,
        'payload' => '',
        'last_activity' => time(),
    ]);
}

function newWorkerPayload(array $overrides = []): array
{
    return ['first_name' => 'Jan', 'last_name' => 'Kowalski', 'password' => '1234', ...$overrides];
}

it('creates an active worker with a generated login and a hashed password', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload());

    $response->assertCreated()->assertJson(['data' => [
        'first_name' => 'Jan',
        'last_name' => 'Kowalski',
        'full_name' => 'Jan Kowalski',
        'login' => 'Jkowal',
        'role' => 'worker',
        'is_active' => true,
    ]]);
    $worker = User::query()->where('login', 'Jkowal')->sole();
    expect($worker->role)->toBe(Role::Worker)
        ->and(Hash::check('1234', $worker->password))->toBeTrue()
        ->and($response->json('data'))->not->toHaveKey('password');
});

it('gives the next free login to a worker with a colliding surname, ignoring letter case', function (): void {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['login' => 'jkowal']);

    $first = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload());
    $second = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload());

    expect($first->json('data.login'))->toBe('Jkowal2')
        ->and($second->json('data.login'))->toBe('Jkowal3');
});

it('accepts the shortest and the longest password', function (string $password): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => $password]));

    $response->assertCreated();
})->with([
    'four characters' => ['1234'],
    'sixty-four characters' => [str_repeat('a', 64)],
    'four spaces and a letter' => ['    a'],
]);

it('rejects an invalid password', function (string $password): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => $password]));

    $response->assertUnprocessable()->assertJsonPath('code', 'VALIDATION_FAILED')->assertJsonValidationErrors(['password']);
    $this->assertDatabaseCount('users', 1);
})->with([
    'three characters' => ['123'],
    'sixty-five characters' => [str_repeat('a', 65)],
    'over 72 bytes in 40 multibyte characters' => [str_repeat('ą', 40)],
    'only spaces' => ['      '],
    'only unicode spaces' => ["\u{00A0}\u{2003}\u{00A0}\u{2003}"],
]);

it('accepts a multibyte password within 72 bytes', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => str_repeat('ą', 36)]));

    $response->assertCreated();
});

it('rejects names without a letter or longer than sixty characters', function (string $field, string $value): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload([$field => $value]));

    $response->assertUnprocessable()->assertJsonValidationErrors([$field]);
})->with([
    'surname of digits' => ['last_name', '1234'],
    'first name of punctuation' => ['first_name', '-. -'],
    'surname of sixty-one letters' => ['last_name', str_repeat('a', 61)],
]);

it('accepts a name with letters from any alphabet', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['last_name' => 'Żółć-123']));

    $response->assertCreated()->assertJsonPath('data.login', 'Jzolc');
});

it('returns 403 when a worker manages accounts', function (): void {
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')->postJson(route('users.store'), newWorkerPayload());

    $response->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
    $this->assertDatabaseCount('users', 1);
});

it('updates the names and keeps the login', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->create(['first_name' => 'Jan', 'last_name' => 'Kowalski', 'login' => 'Jkowal']);

    $response = $this->actingAs($admin, 'web')->patchJson(route('users.update', $worker->id), [
        'first_name' => 'Janusz',
        'last_name' => 'Nowak',
    ]);

    $response->assertOk()->assertJsonPath('data.full_name', 'Janusz Nowak')->assertJsonPath('data.login', 'Jkowal');
    $this->assertDatabaseCount('audit_logs', 0);
});

it('deactivates a worker, signs them out everywhere and audits it', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->create();
    $colleague = User::factory()->create();
    storeSession($worker);
    storeSession($worker, '-second');
    storeSession($colleague);

    $response = $this->actingAs($admin, 'web')
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.9'])
        ->patchJson(route('users.update', $worker->id), ['is_active' => false]);

    $response->assertOk()->assertJsonPath('data.is_active', false);
    $this->assertDatabaseMissing('sessions', ['user_id' => $worker->id]);
    $this->assertDatabaseHas('sessions', ['user_id' => $colleague->id]);
    $audit = AuditLog::query()->sole();
    expect($audit->action)->toBe('user.deactivated')
        ->and($audit->user_id)->toBe($admin->id)
        ->and($audit->subject_id)->toBe($worker->id)
        ->and($audit->before)->toBe(['is_active' => true])
        ->and($audit->after)->toBe(['is_active' => false])
        ->and($audit->ip)->toBe('203.0.113.9');
});

it('reactivates a worker without touching the audit log', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->inactive()->create();

    $response = $this->actingAs($admin, 'web')->patchJson(route('users.update', $worker->id), ['is_active' => true]);

    $response->assertOk()->assertJsonPath('data.is_active', true);
    $this->assertDatabaseCount('audit_logs', 0);
});

it('resets the password, signs the worker out and keeps the password out of the audit log', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->create();
    $colleague = User::factory()->create();
    storeSession($worker);
    storeSession($worker, '-second');
    storeSession($colleague);

    $response = $this->actingAs($admin, 'web')->postJson(route('users.reset_password', $worker->id), ['password' => 'secret-9876']);

    $response->assertNoContent();
    expect(Hash::check('secret-9876', $worker->refresh()->password))->toBeTrue();
    $this->assertDatabaseMissing('sessions', ['user_id' => $worker->id]);
    $this->assertDatabaseHas('sessions', ['user_id' => $colleague->id]);
    $audit = AuditLog::query()->sole();
    expect($audit->action)->toBe('user.password_reset')
        ->and($audit->subject_id)->toBe($worker->id)
        ->and(json_encode($audit->getAttributes()))->not->toContain('secret-9876')->not->toContain($worker->password);
});

it('rejects an invalid new password and leaves the worker untouched', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->create();
    storeSession($worker);

    $response = $this->actingAs($admin, 'web')->postJson(route('users.reset_password', $worker->id), ['password' => '123']);

    $response->assertUnprocessable()->assertJsonValidationErrors(['password']);
    $this->assertDatabaseHas('sessions', ['user_id' => $worker->id]);
    $this->assertDatabaseCount('audit_logs', 0);
});

it('returns 404 for every operation on an admin account or a missing id', function (): void {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    foreach ([$otherAdmin->id, 999999, '99999999999999999999'] as $id) {
        $this->actingAs($admin, 'web')->patchJson(route('users.update', $id), ['is_active' => false])
            ->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->actingAs($admin, 'web')->postJson(route('users.reset_password', $id), ['password' => '1234'])
            ->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
    }

    expect($otherAdmin->refresh()->is_active)->toBeTrue();
    $this->assertDatabaseCount('audit_logs', 0);
});

it('explains in Polish why a name or password was rejected', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['first_name' => '123']));
    $response->assertJsonPath('errors.first_name.0', 'Pole imię musi zawierać co najmniej jedną literę.');

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => "\u{00A0}\u{2003}\u{00A0}\u{2003}"]));
    $response->assertJsonPath('errors.password.0', 'Pole hasło nie może składać się wyłącznie z białych lub niewidocznych znaków.');

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => str_repeat('ą', 40)]));
    $response->assertJsonPath('errors.password.0', 'Pole hasło może mieć najwyżej 72 bajty (znaki spoza ASCII zajmują kilka bajtów).');
});

it('does not audit a worker who was already inactive', function (): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->inactive()->create();

    $response = $this->actingAs($admin, 'web')->patchJson(route('users.update', $worker->id), ['is_active' => false]);

    $response->assertOk()->assertJsonPath('data.is_active', false);
    $this->assertDatabaseCount('audit_logs', 0);
});

it('rejects invalid changes', function (array $payload, string $field): void {
    $admin = User::factory()->admin()->create();
    $worker = User::factory()->create();

    $response = $this->actingAs($admin, 'web')->patchJson(route('users.update', $worker->id), $payload);

    $response->assertUnprocessable()->assertJsonValidationErrors([$field]);
})->with([
    'first name without a letter' => [['first_name' => '123'], 'first_name'],
    'activity that is not boolean' => [['is_active' => 'maybe'], 'is_active'],
    'empty surname' => [['last_name' => ''], 'last_name'],
]);

it('retries after losing the race for the generated login and still creates the worker', function (): void {
    $admin = User::factory()->admin()->create();
    $attempts = 0;
    User::creating(function (User $user) use (&$attempts): void {
        if ($attempts++ === 0) {
            DB::table('users')->insert([
                'first_name' => 'Jan', 'last_name' => 'Rywal', 'login' => $user->login,
                'password' => 'x', 'role' => 'worker', 'is_active' => true,
            ]);
        }
    });

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload());

    $response->assertCreated()->assertJsonPath('data.login', 'Jkowal');
    expect($attempts)->toBe(2);
});

it('stores a password that looks like a bcrypt hash literally so the worker can sign in with it', function (): void {
    $admin = User::factory()->admin()->create();
    $hashLikePassword = '$2y$04$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

    $created = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => $hashLikePassword]));
    $created->assertCreated();
    $reset = User::factory()->worker()->create();
    $this->actingAs($admin, 'web')->postJson(route('users.reset_password', $reset->id), ['password' => $hashLikePassword])->assertNoContent();

    expect(Hash::check($hashLikePassword, User::findOrFail($created->json('data.id'))->password))->toBeTrue()
        ->and(Hash::check($hashLikePassword, $reset->refresh()->password))->toBeTrue();
});

it('rejects invisible characters in names and passwords made only of whitespace or invisible characters', function (string $field, string $value): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload([$field => $value]));

    $response->assertUnprocessable()->assertJsonValidationErrors([$field]);
    $this->assertDatabaseCount('users', 1);
})->with([
    'name with a line break' => ['first_name', "Jan\nPaweł"],
    'name with a tab' => ['last_name', "Kowal\tski"],
    'name with a right-to-left override' => ['last_name', "Kowal\u{202E}ski"],
    'name with a zero-width space' => ['first_name', "Ja\u{200B}n"],
    'name with a byte order mark' => ['last_name', "Kowal\u{FEFF}ski"],
    'password of zero-width spaces' => ['password', "\u{200B}\u{200B}\u{200B}\u{200B}"],
    'password of spaces and a byte order mark' => ['password', " \u{FEFF} \u{200B}"],
]);

it('accepts a zero-width space inside an otherwise visible password', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->postJson(route('users.store'), newWorkerPayload(['password' => "ab\u{200B}cd"]));

    $response->assertCreated();
});
