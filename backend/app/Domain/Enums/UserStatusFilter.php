<?php

declare(strict_types=1);

namespace App\Domain\Enums;

enum UserStatusFilter: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case All = 'all';
}
