<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class WorkerPassword implements ValidationRule
{
    private const int MAX_BYTES = 72;

    /**
     * Fails when the password is longer than bcrypt reads (72 bytes) or consists only of whitespace or invisible characters.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        if (strlen($value) > self::MAX_BYTES) {
            $fail('validation.password_too_many_bytes')->translate();

            return;
        }

        if (preg_match('/\A[\s\p{Z}\p{Cf}]*\z/u', $value) === 1) {
            $fail('validation.password_blank')->translate();
        }
    }
}
