<?php

declare(strict_types=1);

use App\Domain\Services\LoginGenerator;

function generateLogin(string $firstName, string $lastName, array $taken = []): string
{
    $takenLowercase = array_map('strtolower', $taken);

    return (new LoginGenerator)->generate(
        $firstName,
        $lastName,
        static fn (string $candidate): bool => in_array(strtolower($candidate), $takenLowercase, true),
    );
}

it('builds a login from the first letter of the first name and five letters of the surname', function (string $first, string $last, string $expected): void {
    expect(generateLogin($first, $last))->toBe($expected);
})->with([
    'plain' => ['Jan', 'Kowalski', 'Jkowal'],
    'polish letters' => ['Łukasz', 'Ćwikliński', 'Lcwikl'],
    'surname shorter than five letters' => ['Ola', 'Ng', 'Ong'],
    'hyphenated surname' => ['Anna', 'Nowak-Lis', 'Anowak'],
    'lowercase input' => ['jan', 'KOWALSKI', 'Jkowal'],
    'first name without letters uses the surname' => ['123', 'Kowalski', 'Kowals'],
    'no letters at all' => ['123', '-', 'User'],
    'empty surname uses up to six letters of the first name' => ['Bartholomew', '', 'Bartho'],
]);

it('appends the next number while the login is taken, ignoring letter case', function (): void {
    expect(generateLogin('Jan', 'Kowalski', ['jkowal']))->toBe('Jkowal2')
        ->and(generateLogin('Jan', 'Kowalski', ['Jkowal', 'JKOWAL2']))->toBe('Jkowal3')
        ->and(generateLogin('1', '2', ['user']))->toBe('User2');
});
