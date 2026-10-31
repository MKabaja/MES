<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PersonName implements ValidationRule
{
    /**
     * Fails when the name contains a control or invisible format character, or no letter of any alphabet.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        if (preg_match('/[\p{Cc}\p{Cf}]/u', $value) === 1) {
            $fail('validation.person_name_invisible')->translate();

            return;
        }

        if (preg_match('/\p{L}/u', $value) !== 1) {
            $fail('validation.person_name')->translate();
        }
    }
}
