<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;

it('rejects a login differing only by letter case at the database level', function (): void {
    User::factory()->create(['login' => 'Jkowal']);

    User::factory()->create(['login' => 'jkowal']);
})->throws(UniqueConstraintViolationException::class);

it('hashes the password and hides secrets from serialization', function (): void {
    $user = User::factory()->create(['password' => 'secret']);

    expect($user->password)->not->toBe('secret')
        ->and($user->toArray())->not->toHaveKeys(['password', 'remember_token']);
});
