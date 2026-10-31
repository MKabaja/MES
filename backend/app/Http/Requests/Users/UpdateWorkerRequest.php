<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Data\WorkerChangesData;
use App\Http\Requests\Concerns\ResolvesActor;
use App\Rules\PersonName;
use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkerRequest extends FormRequest
{
    use ResolvesActor;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:60', new PersonName],
            'last_name' => ['sometimes', 'required', 'string', 'max:60', new PersonName],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ];
    }

    /**
     * Builds the changes from the validated input, leaving fields that were not sent as null.
     */
    public function toData(): WorkerChangesData
    {
        return new WorkerChangesData(
            firstName: $this->has('first_name') ? $this->string('first_name')->toString() : null,
            lastName: $this->has('last_name') ? $this->string('last_name')->toString() : null,
            isActive: $this->has('is_active') ? $this->boolean('is_active') : null,
        );
    }
}
