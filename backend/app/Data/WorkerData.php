<?php

declare(strict_types=1);

namespace App\Data;

final readonly class WorkerData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $password,
    ) {}
}
