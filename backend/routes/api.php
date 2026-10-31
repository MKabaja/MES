<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware(['stateful', 'throttle:login'])
        ->name('auth.login');

    Route::post('auth/logout', [AuthController::class, 'logout'])
        ->middleware(['auth:sanctum', 'active'])
        ->name('auth.logout');

    Route::middleware(['auth:sanctum', 'active', 'network'])->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');

        Route::get('settings/public', [SettingsController::class, 'showPublic'])
            ->middleware('role:admin,worker')
            ->name('settings.public');

        Route::middleware('role:admin')->group(function (): void {
            Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');
            Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
        });
    });
});
