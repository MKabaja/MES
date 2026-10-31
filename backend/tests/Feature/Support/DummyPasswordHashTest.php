<?php

declare(strict_types=1);

use App\Support\Auth\DummyPasswordHash;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Hashing\HashManager;

it('makes the dummy hash with the configured bcrypt cost', function (): void {
    $hash = app(DummyPasswordHash::class)->value();

    expect(password_get_info($hash))
        ->algoName->toBe('bcrypt')
        ->options->toBe(['cost' => 4]);
});

it('returns the cached dummy hash without hashing again', function (): void {
    $cachedHash = app(DummyPasswordHash::class)->value();
    $hasher = $this->spy(Hasher::class);

    $hash = app(DummyPasswordHash::class)->value();

    expect($hash)->toBe($cachedHash);
    $hasher->shouldNotHaveReceived('make');
});

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
