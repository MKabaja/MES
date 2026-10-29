<?php

declare(strict_types=1);

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use Illuminate\Support\Facades\Route;

it('adds the security headers to api responses', function (): void {
    Route::middleware('api')->get('api/v1/_test/ok', fn () => response()->json(['data' => []]));

    $response = $this->getJson('api/v1/_test/ok');

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=()')
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

it('adds the security headers to error responses', function (): void {
    Route::middleware('api')->get('api/v1/_test/fail', fn () => throw new RuntimeException);

    $response = $this->getJson('api/v1/_test/fail');

    $response->assertStatus(500)->assertHeader('X-Content-Type-Options', 'nosniff');
});

it('omits Strict-Transport-Security in the local environment', function (): void {
    Route::middleware('api')->get('api/v1/_test/ok', fn () => response()->json(['data' => []]));
    app()['env'] = 'local';

    $response = $this->getJson('api/v1/_test/ok');

    $response->assertOk()->assertHeaderMissing('Strict-Transport-Security');
});

it('adds the security headers to a not found response for an unknown api route', function (): void {
    $response = $this->getJson('api/v1/nope');

    $response->assertNotFound()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY');
});

it('adds the security headers to a domain error response', function (): void {
    Route::middleware('api')->get('api/v1/_test/conflict', fn () => throw new DomainException(ErrorCode::OrderLocked, 'Zlecenie jest zablokowane.'));

    $response = $this->getJson('api/v1/_test/conflict');

    $response->assertConflict()->assertHeader('X-Content-Type-Options', 'nosniff');
});
