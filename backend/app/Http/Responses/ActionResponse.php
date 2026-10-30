<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

final class ActionResponse
{
    /**
     * Builds the action envelope with data and a warnings list that is always present.
     *
     * @param  array<string, mixed>  $data
     * @param  list<array{code: string, message: string, context: array<string, mixed>}>  $warnings
     */
    public static function make(array $data, array $warnings = []): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'warnings' => $warnings,
        ]);
    }
}
