<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;

final class PaginatedResponse
{
    /**
     * Wraps a page of resources in the contract envelope with pagination meta and no links.
     *
     * @param  LengthAwarePaginator<int, mixed>  $paginator
     * @param  class-string<JsonResource>  $resourceClass
     */
    public static function make(LengthAwarePaginator $paginator, string $resourceClass): AnonymousResourceCollection
    {
        return $resourceClass::collection($paginator->getCollection())->additional([
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
