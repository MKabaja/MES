<?php

declare(strict_types=1);

arch()->preset()->php();
arch()->preset()->security();

arch('strict types')->expect('App')->toUseStrictTypes();

arch('controllers are thin')->expect('App\Http\Controllers')
    ->not->toUse([
        'Illuminate\Support\Facades\DB',
        'Illuminate\Database\Eloquent\Builder',
        'Illuminate\Database\Query\Builder',
    ]);

arch('actions know nothing about HTTP')->expect('App\Actions')
    ->not->toUse([
        'Illuminate\Http',
        'App\Http',
        'Illuminate\Support\Facades\Auth',
        'Illuminate\Support\Facades\Request',
    ]);

arch('domain is framework-light')->expect('App\Domain')
    ->not->toUse([
        'Illuminate\Http',
        'App\Http',
        'App\Actions',
        'Illuminate\Support\Facades',
    ]);

arch('repositories do not use HTTP')->expect('App\Repositories')
    ->not->toUse(['Illuminate\Http', 'App\Http', 'App\Actions']);

arch('models do not call actions')->expect('App\Models')
    ->not->toUse(['App\Actions', 'App\Http']);

arch('actions are final')->expect('App\Actions')->toBeFinal();

arch('dtos are readonly')->expect('App\Data')->toBeReadonly()->toBeFinal();

arch('domain services are final')->expect('App\Domain\Services')->toBeFinal();

arch('no debug')->expect(['dd', 'dump', 'ray', 'var_dump'])->not->toBeUsed();
