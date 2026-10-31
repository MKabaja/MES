<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'shift_start',
    'shift_end',
    'breaks',
    'deduct_breaks',
    'auto_pause_enabled',
    'worker_backdate_days',
    'station_idle_logout_minutes',
    'worker_network_restriction_enabled',
    'worker_allowed_networks',
])]
class Setting extends Model
{
    public const int SINGLETON_ID = 1;

    public const CREATED_AT = null;

    public $incrementing = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'breaks' => 'array',
            'deduct_breaks' => 'boolean',
            'auto_pause_enabled' => 'boolean',
            'worker_backdate_days' => 'integer',
            'station_idle_logout_minutes' => 'integer',
            'worker_network_restriction_enabled' => 'boolean',
            'worker_allowed_networks' => 'array',
        ];
    }
}
