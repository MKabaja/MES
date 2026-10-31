<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class WorkerChoiceResource extends JsonResource
{
    /**
     * Exposes the login only to office users, so hall workers cannot read their colleagues' logins.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->first_name.' '.$this->last_name,
            'login' => $this->when($request->user()?->isAdmin() === true, $this->login),
        ];
    }
}
