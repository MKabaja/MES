<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\WorkerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware(['stateful', 'throttle:login'])
        ->name('auth.login');

    Route::post('auth/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum')
        ->name('auth.logout');

    Route::middleware(['auth:sanctum', 'active', 'network'])->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');

        Route::get('settings/public', [SettingsController::class, 'showPublic'])
            ->middleware('role:admin,worker')
            ->name('settings.public');

        Route::get('workers', [WorkerController::class, 'index'])
            ->middleware('role:admin,worker')
            ->name('workers.index');

        Route::middleware('role:admin')->group(function (): void {
            Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');
            Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

            Route::get('users', [UserController::class, 'index'])->name('users.index');
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::patch('users/{id}', [UserController::class, 'update'])->where('id', '[0-9]{1,18}')->name('users.update');
            Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword'])
                ->where('id', '[0-9]{1,18}')
                ->name('users.reset_password');
        });
    });
});
