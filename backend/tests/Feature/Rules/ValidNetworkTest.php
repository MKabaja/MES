<?php

declare(strict_types=1);

use App\Rules\ValidNetwork;
use Illuminate\Support\Facades\Validator;

function networkValidationFails(mixed $value): bool
{
    return Validator::make(['network' => $value], ['network' => [new ValidNetwork]])->fails();
}

it('accepts IPv4 and IPv6 addresses and CIDR ranges within the prefix limits', function (string $network): void {
    expect(networkValidationFails($network))->toBeFalse();
})->with([
    'IPv4 address' => '192.168.1.10',
    'IPv4 prefix 1' => '128.0.0.0/1',
    'IPv4 prefix 32' => '10.0.0.5/32',
    'IPv6 address' => 'fd00::10',
    'IPv6 prefix 1' => '8000::/1',
    'IPv6 prefix 128' => 'fd00::10/128',
]);

it('rejects values that are not an address or a CIDR range', function (mixed $network): void {
    expect(networkValidationFails($network))->toBeTrue();
})->with([
    'text' => 'office',
    'octet out of range' => '256.1.1.1',
    'IPv4 prefix 33' => '10.0.0.0/33',
    'IPv6 prefix 129' => 'fd00::/129',
    'missing prefix' => '10.0.0.0/',
    'negative prefix' => '10.0.0.0/-1',
    'prefix with leading zero' => '10.0.0.0/024',
    'two prefixes' => '10.0.0.0/24/8',
    'trailing newline address' => "10.0.0.1\n",
    'trailing newline prefix' => "10.0.0.0/24\n",
    'surrounding whitespace' => ' 10.0.0.1',
    'integer' => 12,
    'array' => [['10.0.0.1']],
]);

it('rejects a range that covers every address', function (string $network): void {
    $validator = Validator::make(['network' => $network], ['network' => [new ValidNetwork]]);
    $validator->setAttributeNames(['network' => 'sieć']);

    expect($validator->errors()->keys())->toBe(['network'])
        ->and($validator->errors()->first('network'))->toBe('Pole sieć nie może obejmować wszystkich adresów (prefiks 0).');
})->with([
    'IPv4' => '0.0.0.0/0',
    'IPv6' => '::/0',
]);
