<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Data\WorkerData;
use App\Rules\PersonName;
use App\Rules\WorkerPassword;
use Illuminate\Foundation\Http\FormRequest;

class CreateWorkerRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:60', new PersonName],
            'last_name' => ['required', 'string', 'max:60', new PersonName],
            'password' => ['required', 'string', 'min:4', 'max:64', new WorkerPassword],
        ];
    }

    /**
     * Builds the new worker data from the validated input.
     */
    public function toData(): WorkerData
    {
        return new WorkerData(
            firstName: $this->string('first_name')->toString(),
            lastName: $this->string('last_name')->toString(),
            password: $this->string('password')->toString(),
        );
    }
}
