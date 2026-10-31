<?php

declare(strict_types=1);

namespace App\Data;

final readonly class AdminData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $login,
        public string $password,
    ) {}
}
