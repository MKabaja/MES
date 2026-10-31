<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Data\AdminData;
use App\Domain\Enums\Role;
use App\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

final readonly class CreateAdminAction
{
    public function __construct(private Hasher $hasher) {}

    /**
     * Creates an active office account with the given login and a hashed password.
     *
     * @throws UniqueConstraintViolationException when the login is already taken, including by a concurrent request
     */
    public function handle(AdminData $data): User
    {
        return DB::transaction(fn (): User => User::create([
            'first_name' => $data->firstName,
            'last_name' => $data->lastName,
            'login' => $data->login,
            'password' => $this->hasher->make($data->password),
            'role' => Role::Admin,
            'is_active' => true,
        ]));
    }
}
