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

        $normalizedIp = IpAddress::unmapIpv4($ip);

        if ($normalizedIp === '' || ! IpUtils::checkIp($normalizedIp, $settings->workerAllowedNetworks)) {
            throw new DomainException(ErrorCode::NetworkNotAllowed);
        }
    }
}
