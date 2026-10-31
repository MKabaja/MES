<?php

declare(strict_types=1);

namespace App\Domain\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Worker = 'worker';
}
