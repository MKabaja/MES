<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Data\UserFilters;
use App\Domain\Enums\UserStatusFilter;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository
{
    /**
     * Returns a page of hall worker accounts matching the filters, ordered by surname.
     *
     * @return LengthAwarePaginator<int, User>
     */
    public function paginateWorkers(UserFilters $filters): LengthAwarePaginator
    {
        return User::query()
            ->workers()
            ->when($filters->status !== UserStatusFilter::All, fn (Builder $query) => $query->where('is_active', $filters->status === UserStatusFilter::Active))
            ->when($filters->search !== null, fn (Builder $query) => $this->matchingSearch($query, (string) $filters->search))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->orderBy('id')
            ->paginate(perPage: $filters->perPage, page: $filters->page);
    }

    /**
     * Returns active hall workers ordered by surname, for choosing a co-worker.
     *
     * @return Collection<int, User>
     */
    public function activeWorkers(): Collection
    {
        return User::query()
            ->workers()
            ->where('is_active', true)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->orderBy('id')
            ->get(['id', 'first_name', 'last_name', 'login']);
    }

    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    private function matchingSearch(Builder $query, string $search): Builder
    {
        $pattern = '%'.addcslashes($search, '\\%_').'%';

        return $query->where(fn (Builder $group) => $group
            ->where('first_name', 'ilike', $pattern)
            ->orWhere('last_name', 'ilike', $pattern)
            ->orWhere('login', 'ilike', $pattern));
    }
}
