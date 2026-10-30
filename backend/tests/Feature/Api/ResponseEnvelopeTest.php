<?php

declare(strict_types=1);

use App\Http\Responses\ActionResponse;
use App\Http\Responses\PaginatedResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Route;

final class PlainItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return ['id' => $this->resource['id']];
    }
}

it('wraps a page in data and meta without links', function (): void {
    $paginator = new LengthAwarePaginator([['id' => 1], ['id' => 2]], 120, 25, 2);
    Route::middleware('api')->get('api/v1/_test/page', fn () => PaginatedResponse::make($paginator, PlainItemResource::class));

    $response = $this->getJson('api/v1/_test/page');

    $response->assertOk()->assertExactJson([
        'data' => [['id' => 1], ['id' => 2]],
        'meta' => ['current_page' => 2, 'per_page' => 25, 'total' => 120, 'last_page' => 5],
    ]);
});

it('always includes warnings in an action response', function (): void {
    Route::middleware('api')->get('api/v1/_test/action', fn () => ActionResponse::make(['position' => null]));

    $response = $this->getJson('api/v1/_test/action');

    $response->assertOk()->assertExactJson(['data' => ['position' => null], 'warnings' => []]);
});

it('returns warnings with code, message and context', function (): void {
    $warning = ['code' => 'STOCK_NEGATIVE', 'message' => 'Stan ujemny.', 'context' => ['material_id' => 7]];
    Route::middleware('api')->get('api/v1/_test/action', fn () => ActionResponse::make([], [$warning]));

    $response = $this->getJson('api/v1/_test/action');

    $response->assertOk()->assertJsonPath('warnings.0', $warning);
});
