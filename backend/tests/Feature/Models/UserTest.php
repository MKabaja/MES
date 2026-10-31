<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;

it('rejects a login differing only by letter case at the database level', function (): void {
    User::factory()->create(['login' => 'Jkowal']);

    User::factory()->create(['login' => 'jkowal']);
})->throws(UniqueConstraintViolationException::class);
