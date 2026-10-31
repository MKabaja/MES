<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class OfficeLogin implements ValidationRule
{
    /**
     * Fails when the login contains any whitespace, control or invisible character.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && preg_match('/[\s\p{Z}\p{C}]/u', $value) === 1) {
            $fail('validation.login_characters')->translate();
        }
    }
}
