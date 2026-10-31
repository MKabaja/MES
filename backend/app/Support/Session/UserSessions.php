<?php

declare(strict_types=1);

namespace App\Support\Session;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class UserSessions
{
    /**
     * Deletes every stored session of the user, so the user is signed out everywhere.
     */
    public function revokeAll(User $user): void
    {
        DB::connection(Config::get('session.connection'))->table(Config::string('session.table'))->where('user_id', $user->getKey())->delete();
    }
}
