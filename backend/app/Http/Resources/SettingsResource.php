<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\ValueObjects\PlantSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PlantSettings $resource
 */
class SettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->resource->toArray();
    }
}
