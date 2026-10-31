<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkerChoiceResource;
use App\Repositories\UserRepository;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkerController extends Controller
{
    public function index(UserRepository $users): AnonymousResourceCollection
    {
        return WorkerChoiceResource::collection($users->activeWorkers());
    }
}
