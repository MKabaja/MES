<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Data\WorkerData;
use App\Domain\Enums\Role;
use App\Domain\Services\LoginGenerator;
use App\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

final readonly class CreateWorkerAction
{
    private const int MAX_ATTEMPTS = 5;

    public function __construct(private LoginGenerator $loginGenerator, private Hasher $hasher) {}

    /**
     * Creates an active hall worker with a generated login, retrying with the next free login when a concurrent request takes it first.
     *
     * @throws UniqueConstraintViolationException when every attempt loses the race for the login
     */
    public function handle(WorkerData $data): User
    {
        $attempt = 1;

        while (true) {
            try {
                return DB::transaction(fn (): User => $this->create($data));
            } catch (UniqueConstraintViolationException $exception) {
                if ($attempt++ >= self::MAX_ATTEMPTS) {
                    throw $exception;
                }
            }
        }
    }

    private function create(WorkerData $data): User
    {
        $login = $this->loginGenerator->generate(
            $data->firstName,
            $data->lastName,
            fn (string $candidate): bool => User::query()->whereLoginIs($candidate)->exists(),
        );

        return User::create([
            'first_name' => $data->firstName,
            'last_name' => $data->lastName,
            'login' => $login,
            'password' => $this->hasher->make($data->password),
            'role' => Role::Worker,
            'is_active' => true,
        ]);
    }
}
