<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\ValueObjects\PlantSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PlantSettings $resource
 */
class PublicSettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $settings = $this->resource->toArray();

        return [
            'shift_start' => $settings['shift_start'],
            'shift_end' => $settings['shift_end'],
            'breaks' => $settings['breaks'],
            'worker_backdate_days' => $settings['worker_backdate_days'],
            'station_idle_logout_minutes' => $settings['station_idle_logout_minutes'],
        ];
    }
}
