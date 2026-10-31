<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidNetwork implements ValidationRule
{
    private const int MAX_IPV4_PREFIX = 32;

    private const int MAX_IPV6_PREFIX = 128;

    /**
     * Fails unless the value is an IPv4 or IPv6 address, optionally followed by a CIDR prefix in range for its version, and rejects ranges that cover every address and IPv4-mapped IPv6 addresses.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! $this->isNetwork($value)) {
            $fail('validation.network')->translate();

            return;
        }

        if ($this->isIpv4Mapped($value)) {
            $fail('validation.network_ipv4_mapped')->translate();

            return;
        }

        if ($this->coversEveryAddress($value)) {
            $fail('validation.network_too_broad')->translate();
        }
    }

    private function isIpv4Mapped(string $value): bool
    {
        $packedAddress = inet_pton(explode('/', $value)[0]);

        return $packedAddress !== false
            && strlen($packedAddress) === 16
            && str_starts_with($packedAddress, str_repeat("\0", 10)."\xff\xff");
    }

    private function coversEveryAddress(string $value): bool
    {
        return str_contains($value, '/') && (int) explode('/', $value)[1] === 0;
    }

    private function isNetwork(string $value): bool
    {
        $parts = explode('/', $value);

        if (count($parts) > 2) {
            return false;
        }

        $address = $parts[0];
        $prefix = $parts[1] ?? null;

        $isIpv4 = filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false;
        $isIpv6 = filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;

        if (! $isIpv4 && ! $isIpv6) {
            return false;
        }

        if ($prefix === null) {
            return true;
        }

        $maxPrefix = $isIpv4 ? self::MAX_IPV4_PREFIX : self::MAX_IPV6_PREFIX;

        return preg_match('/^(0|[1-9]\d{0,2})\z/', $prefix) === 1 && (int) $prefix <= $maxPrefix;
    }
}
