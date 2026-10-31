<?php

declare(strict_types=1);

use App\Support\Auth\DummyPasswordHash;
use Illuminate\Hashing\HashManager;

it('makes a new dummy hash with the new cost when the bcrypt rounds change', function (): void {
    $hashWithOldCost = app(DummyPasswordHash::class)->value();
    config(['hashing.bcrypt.rounds' => 5]);
    app(HashManager::class)->forgetDrivers();
    app()->forgetInstance('hash.driver');

    $hash = app(DummyPasswordHash::class)->value();

    expect($hash)->not->toBe($hashWithOldCost)
        ->and(password_get_info($hash)['options'])->toBe(['cost' => 5])
        ->and(app(DummyPasswordHash::class)->value())->toBe($hash);
});
