<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Http\Requests\Concerns\ResolvesActor;
use App\Rules\WorkerPassword;
use Illuminate\Foundation\Http\FormRequest;

class ResetWorkerPasswordRequest extends FormRequest
{
    use ResolvesActor;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:4', 'max:64', new WorkerPassword],
        ];
    }

    /**
     * Returns the validated new password.
     */
    public function newPassword(): string
    {
        return $this->string('password')->toString();
    }
}
