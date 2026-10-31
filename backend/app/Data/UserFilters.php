<?php

declare(strict_types=1);

namespace App\Data;

use App\Domain\Enums\UserStatusFilter;

final readonly class UserFilters
{
    public function __construct(
        public ?string $search,
        public UserStatusFilter $status,
        public int $page,
        public int $perPage,
    ) {}
}
