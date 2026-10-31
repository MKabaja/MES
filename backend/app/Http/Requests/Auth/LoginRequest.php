<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Data\LoginData;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Builds the credentials from the validated input.
     */
    public function toData(): LoginData
    {
        return new LoginData(
            login: $this->string('login')->toString(),
            password: $this->string('password')->toString(),
        );
    }
}
