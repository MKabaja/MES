<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');

    $protectedRoute = ['api', 'auth:sanctum', 'active', 'network'];
    Route::middleware([...$protectedRoute, 'role:worker'])->get('api/v1/testing/hall', fn () => response()->noContent());
    Route::middleware([...$protectedRoute, 'role:admin'])->get('api/v1/testing/office', fn () => response()->noContent());
    Route::middleware([...$protectedRoute, 'role:admin,worker'])->get('api/v1/testing/shared', fn () => response()->noContent());
});

it('returns 403 FORBIDDEN when an admin opens a hall route', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin, 'web')->getJson('api/v1/testing/hall');

    $response->assertForbidden()->assertExactJson([
        'message' => 'Brak uprawnień do wykonania tej operacji.',
        'code' => 'FORBIDDEN',
    ]);
});

it('returns 403 FORBIDDEN when a worker opens an office route', function (): void {
    $worker = User::factory()->worker()->create();

    $response = $this->actingAs($worker, 'web')->getJson('api/v1/testing/office');

    $response->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
});

it('lets a user through a route of their own role', function (string $factoryState, string $uri): void {
    $user = User::factory()->{$factoryState}()->create();

    $response = $this->actingAs($user, 'web')->getJson($uri);

    $response->assertNoContent();
})->with([
    'worker on a hall route' => ['worker', 'api/v1/testing/hall'],
    'worker on a shared route' => ['worker', 'api/v1/testing/shared'],
]);

it('reports a disabled account before checking the role', function (): void {
    $admin = User::factory()->admin()->inactive()->create();

    $response = $this->actingAs($admin, 'web')->getJson('api/v1/testing/hall');

    $response->assertForbidden()->assertJsonPath('code', 'ACCOUNT_INACTIVE');
});
