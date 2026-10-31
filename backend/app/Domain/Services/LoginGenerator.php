<?php

declare(strict_types=1);

namespace App\Domain\Services;

use Closure;
use Illuminate\Support\Str;

final class LoginGenerator
{
    private const int SURNAME_LETTERS = 5;

    private const int FIRST_NAME_LETTERS_WITHOUT_SURNAME = 6;

    private const string FALLBACK_BASE = 'User';

    /**
     * Builds a login from the first letter of the first name and up to five letters of the surname, appending 2, 3, … until it is free.
     *
     * @param  Closure(string): bool  $exists  tells whether a login is taken, ignoring letter case
     */
    public function generate(string $firstName, string $lastName, Closure $exists): string
    {
        $base = $this->base($firstName, $lastName);
        $candidate = $base;
        $suffix = 2;

        while ($exists($candidate)) {
            $candidate = $base.$suffix++;
        }

        return $candidate;
    }

    private function base(string $firstName, string $lastName): string
    {
        $firstLetters = $this->lettersOnly($firstName);
        $lastLetters = $this->lettersOnly($lastName);

        if ($firstLetters === '') {
            return $lastLetters === '' ? self::FALLBACK_BASE : $this->capitalized($lastLetters, self::FIRST_NAME_LETTERS_WITHOUT_SURNAME);
        }

        if ($lastLetters === '') {
            return $this->capitalized($firstLetters, self::FIRST_NAME_LETTERS_WITHOUT_SURNAME);
        }

        return strtoupper($firstLetters[0]).strtolower(substr($lastLetters, 0, self::SURNAME_LETTERS));
    }

    private function capitalized(string $letters, int $length): string
    {
        return ucfirst(strtolower(substr($letters, 0, $length)));
    }

    private function lettersOnly(string $name): string
    {
        return (string) preg_replace('/[^A-Za-z]/', '', Str::ascii($name));
    }
}
