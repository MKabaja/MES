<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use App\Domain\ValueObjects\PlantSettings;
use App\Models\User;
use Symfony\Component\HttpFoundation\IpUtils;

final readonly class WorkerNetworkAccess
{
    private const string IPV4_MAPPED_IPV6_PREFIX = "\0\0\0\0\0\0\0\0\0\0\xff\xff";

    /**
     * Rejects a non-admin user whose IP address lies outside the allowed networks while the network restriction is enabled.
     *
     * @throws DomainException NETWORK_NOT_ALLOWED
     */
    public function assertAllowed(User $user, string $ip, PlantSettings $settings): void
    {
        if ($user->isAdmin() || ! $settings->workerNetworkRestrictionEnabled) {
            return;
        }

        $normalizedIp = self::unmapIpv4($ip);

        if ($normalizedIp === '' || ! IpUtils::checkIp($normalizedIp, $settings->workerAllowedNetworks)) {
            throw new DomainException(ErrorCode::NetworkNotAllowed);
        }
    }

    private static function unmapIpv4(string $ip): string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) === false) {
            return $ip;
        }

        $packedIp = (string) inet_pton($ip);

        if (! str_starts_with($packedIp, self::IPV4_MAPPED_IPV6_PREFIX)) {
            return $ip;
        }

        return (string) inet_ntop(substr($packedIp, 12));
    }
}
