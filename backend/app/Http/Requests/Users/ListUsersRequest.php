<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Data\UserFilters;
use App\Domain\Enums\UserStatusFilter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListUsersRequest extends FormRequest
{
    private const int DEFAULT_PER_PAGE = 25;

    private const int MAX_PER_PAGE = 100;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(UserStatusFilter::class)],
            'page' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'per_page' => ['nullable', 'integer', 'between:1,'.self::MAX_PER_PAGE],
        ];
    }

    /**
     * Builds the list filters from the validated input, applying the contract defaults.
     */
    public function toFilters(): UserFilters
    {
        return new UserFilters(
            search: $this->filled('search') ? $this->string('search')->toString() : null,
            status: $this->enum('status', UserStatusFilter::class) ?? UserStatusFilter::Active,
            page: $this->integer('page', 1),
            perPage: $this->integer('per_page', self::DEFAULT_PER_PAGE),
        );
    }
}
