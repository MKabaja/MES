<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Settings\UpdateSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateSettingsRequest;
use App\Http\Resources\PublicSettingsResource;
use App\Http\Resources\SettingsResource;
use App\Repositories\SettingsRepository;

class SettingsController extends Controller
{
    public function show(SettingsRepository $settings): SettingsResource
    {
        return new SettingsResource($settings->current());
    }

    public function update(UpdateSettingsRequest $request, UpdateSettingsAction $updateSettings): SettingsResource
    {
        return new SettingsResource(
            $updateSettings->handle($request->actor(), $request->toData(), $request->ip()),
        );
    }

    public function showPublic(SettingsRepository $settings): PublicSettingsResource
    {
        return new PublicSettingsResource($settings->current());
    }
}
