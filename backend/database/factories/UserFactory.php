<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'login' => fake()->unique()->regexify('[A-Za-z][A-Za-z0-9]{7,19}'),
            'password' => static::$password ??= Hash::make('password'),
            'role' => Role::Worker,
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(['role' => Role::Admin]);
    }

    public function worker(): static
    {
        return $this->state(['role' => Role::Worker]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
