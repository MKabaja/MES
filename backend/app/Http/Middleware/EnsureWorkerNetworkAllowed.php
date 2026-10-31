<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Exceptions\DomainException;
use App\Domain\Services\WorkerNetworkAccess;
use App\Repositories\SettingsRepository;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class EnsureWorkerNetworkAllowed
{
    public function __construct(
        private WorkerNetworkAccess $networkAccess,
        private SettingsRepository $settings,
    ) {}

    /**
     * Rejects requests of a non-admin user coming from outside the allowed networks.
     *
     * @param  Closure(Request): Response  $next
     *
     * @throws AuthenticationException
     * @throws DomainException NETWORK_NOT_ALLOWED
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? throw new AuthenticationException;

        $this->networkAccess->assertAllowed($user, (string) $request->ip(), $this->settings->current());

        return $next($request);
    }
}
