<?php

declare(strict_types=1);

namespace App\Data;

final readonly class WorkerChangesData
{
    public function __construct(
        public ?string $firstName,
        public ?string $lastName,
        public ?bool $isActive,
    ) {}
}
