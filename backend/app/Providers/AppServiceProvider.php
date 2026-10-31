<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Repositories\SettingsRepository;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use LogicException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(SettingsRepository::class);

        $this->app->when([LoginAction::class, LogoutAction::class])
            ->needs(StatefulGuard::class)
            ->give(fn (): StatefulGuard => $this->webGuard());
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
        Date::use(CarbonImmutable::class);
        Sanctum::getAccessTokenFromRequestUsing(fn (): ?string => null);

        RateLimiter::for('login', function (Request $request): Limit {
            $login = $request->input('login');
            $normalizedLogin = is_string($login) ? Str::lower($login) : '';

            return Limit::perMinute(5)->by($normalizedLogin.'|'.$request->ip());
        });
    }

    private function webGuard(): StatefulGuard
    {
        $guard = $this->app->make(AuthFactory::class)->guard('web');

        if (! $guard instanceof StatefulGuard) {
            throw new LogicException('The web guard must be stateful.');
        }

        return $guard;
    }
}
