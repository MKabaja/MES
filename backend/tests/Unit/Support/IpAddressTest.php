<?php

declare(strict_types=1);

use App\Support\Network\IpAddress;

it('leaves the address unchanged when it is not an ipv4-mapped ipv6 address', function (string $ip): void {
    expect(IpAddress::unmapIpv4($ip))->toBe($ip);
})->with([
    'ipv4' => '10.0.0.1',
    'ipv6' => '2001:db8::1',
    'not an ip' => 'not-an-ip',
    'empty' => '',
]);

it('converts an ipv4-mapped ipv6 address to ipv4', function (string $ip): void {
    expect(IpAddress::unmapIpv4($ip))->toBe('10.0.0.1');
})->with([
    'short form' => '::ffff:10.0.0.1',
    'hex form' => '::ffff:0a00:0001',
]);
