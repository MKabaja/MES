<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\SettingsRepository;
use Carbon\CarbonImmutable;
use Illuminate\Auth\SessionGuard;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
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

        $this->app->when(LoginAction::class)
            ->needs(SessionGuard::class)
            ->give(fn (): SessionGuard => $this->webGuard());

        $this->app->when(LogoutAction::class)
            ->needs(StatefulGuard::class)
            ->give(fn (): StatefulGuard => $this->webGuard());
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
        Relation::enforceMorphMap([
            'user' => User::class,
            'settings' => Setting::class,
            'audit_log' => AuditLog::class,
        ]);
        Date::use(CarbonImmutable::class);
        Sanctum::getAccessTokenFromRequestUsing(fn (): ?string => null);

        RateLimiter::for('login', function (Request $request): Limit {
            $login = $request->input('login');
            $normalizedLogin = is_string($login) ? Str::lower($login) : '';

            return Limit::perMinute(5)->by($normalizedLogin.'|'.$request->ip());
        });

        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute(120)->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }

    private function webGuard(): SessionGuard
    {
        $guard = $this->app->make(AuthFactory::class)->guard('web');

        if (! $guard instanceof SessionGuard) {
            throw new LogicException('The web guard must be a session guard.');
        }

        return $guard;
    }
}
