<?php

declare(strict_types=1);

namespace App\Support\Auth;

use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Support\Str;

final readonly class DummyPasswordHash
{
    private const CACHE_KEY = 'auth.dummy_password_hash';

    public function __construct(
        private Cache $cache,
        private Hasher $hasher,
    ) {}

    /**
     * Returns a cached hash of a random password made with the current hashing settings, hashing anew only when the cached one is missing or outdated.
     */
    public function value(): string
    {
        $cachedHash = $this->cache->get(self::CACHE_KEY);

        if (is_string($cachedHash) && ! $this->hasher->needsRehash($cachedHash)) {
            return $cachedHash;
        }

        $hash = $this->hasher->make(Str::random(40));
        $this->cache->forever(self::CACHE_KEY, $hash);

        return $hash;
    }
}
