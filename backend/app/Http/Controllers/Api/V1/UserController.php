<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Users\CreateWorkerAction;
use App\Actions\Users\ResetWorkerPasswordAction;
use App\Actions\Users\UpdateWorkerAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\CreateWorkerRequest;
use App\Http\Requests\Users\ListUsersRequest;
use App\Http\Requests\Users\ResetWorkerPasswordRequest;
use App\Http\Requests\Users\UpdateWorkerRequest;
use App\Http\Resources\UserListResource;
use App\Http\Resources\UserResource;
use App\Http\Responses\PaginatedResponse;
use App\Repositories\UserRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class UserController extends Controller
{
    /**
     * Lists workers with filters and pagination.
     */
    public function index(ListUsersRequest $request, UserRepository $users): AnonymousResourceCollection
    {
        return PaginatedResponse::make($users->paginateWorkers($request->toFilters()), UserListResource::class);
    }

    /**
     * Creates a worker account with a generated login.
     */
    public function store(CreateWorkerRequest $request, CreateWorkerAction $createWorker): JsonResponse
    {
        return (new UserResource($createWorker->handle($request->toData())))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    /**
     * Updates the data of a worker account.
     */
    public function update(UpdateWorkerRequest $request, UpdateWorkerAction $updateWorker, int $id): UserResource
    {
        return new UserResource($updateWorker->handle($request->actor(), $id, $request->toData(), $request->ip()));
    }

    /**
     * Sets a new password for a worker account.
     */
    public function resetPassword(ResetWorkerPasswordRequest $request, ResetWorkerPasswordAction $resetPassword, int $id): Response
    {
        $resetPassword->handle($request->actor(), $id, $request->newPassword(), $request->ip());

        return response()->noContent();
    }
}
