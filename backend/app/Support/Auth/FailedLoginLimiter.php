<?php

declare(strict_types=1);

namespace App\Support\Auth;

use App\Support\Network\IpAddress;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Exceptions\ThrottleRequestsException;

final readonly class FailedLoginLimiter
{
    private const MAX_FAILED_ATTEMPTS = 20;

    private const DECAY_SECONDS = 60;

    private const IPV6_NETWORK_PREFIX_BYTES = 8;

    public function __construct(private RateLimiter $limiter) {}

    /**
     * Counts the login attempt of the client network up front and rejects it once the network exceeds its failed attempts in the current window.
     *
     * @throws ThrottleRequestsException
     */
    public function registerAttempt(string $ip): void
    {
        $key = $this->keyFor($ip);

        if ($this->limiter->hit($key, self::DECAY_SECONDS) > self::MAX_FAILED_ATTEMPTS) {
            throw new ThrottleRequestsException(headers: ['Retry-After' => $this->limiter->availableIn($key)]);
        }
    }

    /**
     * Withdraws the registered attempt of the client network after the password turned out to be correct.
     */
    public function releaseAttempt(string $ip): void
    {
        $this->limiter->decrement($this->keyFor($ip), self::DECAY_SECONDS);
    }

    private function keyFor(string $ip): string
    {
        return 'login-failures|'.$this->networkOf($ip);
    }

    private function networkOf(string $ip): string
    {
        $unmappedIp = IpAddress::unmapIpv4($ip);

        if (filter_var($unmappedIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) === false) {
            return $unmappedIp;
        }

        $networkAddress = str_pad(substr((string) inet_pton($unmappedIp), 0, self::IPV6_NETWORK_PREFIX_BYTES), 16, "\0");

        return inet_ntop($networkAddress).'/64';
    }
}
