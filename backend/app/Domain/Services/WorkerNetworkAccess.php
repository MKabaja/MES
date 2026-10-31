<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use App\Domain\ValueObjects\PlantSettings;
use App\Models\User;
use App\Support\Network\IpAddress;
use Symfony\Component\HttpFoundation\IpUtils;

final readonly class WorkerNetworkAccess
{
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

        if (! $this->isInsideAllowedNetworks($ip, $settings)) {
            throw new DomainException(ErrorCode::NetworkNotAllowed);
        }
    }

    /**
     * Tells whether the IP address lies inside one of the allowed networks, regardless of whether the restriction is enabled.
     */
    public function isInsideAllowedNetworks(string $ip, PlantSettings $settings): bool
    {
        $normalizedIp = IpAddress::unmapIpv4($ip);

        return $normalizedIp !== '' && IpUtils::checkIp($normalizedIp, $settings->workerAllowedNetworks);
    }
}
