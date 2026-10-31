<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    /**
     * Signs the user in and returns the account.
     */
    public function login(LoginRequest $request, LoginAction $login): UserResource
    {
        return new UserResource($login->handle($request->toData(), (string) $request->ip(), $request->session()));
    }

    /**
     * Ends the current session.
     */
    public function logout(Request $request, LogoutAction $logout): Response
    {
        $logout->handle($request->session());

        return response()->noContent();
    }

    /**
     * Returns the signed-in account.
     */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
