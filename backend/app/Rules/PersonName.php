<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PersonName implements ValidationRule
{
    /**
     * Fails unless the name contains at least one letter of any alphabet.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && preg_match('/\p{L}/u', $value) !== 1) {
            $fail('validation.person_name')->translate();
        }
    }
}
