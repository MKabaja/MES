<?php

declare(strict_types=1);

namespace App\Support\Network;

final class IpAddress
{
    private const string IPV4_MAPPED_IPV6_PREFIX = "\0\0\0\0\0\0\0\0\0\0\xff\xff";

    /**
     * Converts an IPv4-mapped IPv6 address to plain IPv4 and returns any other input unchanged.
     */
    public static function unmapIpv4(string $ip): string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) === false) {
            return $ip;
        }

        $packedIp = (string) inet_pton($ip);

        if (! str_starts_with($packedIp, self::IPV4_MAPPED_IPV6_PREFIX)) {
            return $ip;
        }

        return (string) inet_ntop(substr($packedIp, strlen(self::IPV4_MAPPED_IPV6_PREFIX)));
    }
}
