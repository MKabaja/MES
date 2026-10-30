<?php

declare(strict_types=1);

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use Illuminate\Support\Facades\Route;

it('adds the security headers to api responses', function (): void {
    config(['mes.hsts.max_age' => 31536000, 'mes.hsts.include_subdomains' => false]);
    Route::middleware('api')->get('api/v1/_test/ok', fn () => response()->json(['data' => []]));

    $response = $this->getJson('api/v1/_test/ok');

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=()')
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000');
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

it('adds the security headers to a response cut short by an earlier global middleware', function (): void {
    Route::middleware('api')->post('api/v1/_test/upload', fn () => response()->json(['data' => []]));

    $response = $this->call('POST', 'api/v1/_test/upload', server: [
        'CONTENT_LENGTH' => 99999999999,
        'HTTP_ACCEPT' => 'application/json',
    ]);

    $response->assertStatus(413)
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertExactJson(['message' => 'Żądanie jest zbyt duże.', 'code' => 'PAYLOAD_TOO_LARGE']);
});

it('adds includeSubDomains to Strict-Transport-Security when configured', function (): void {
    Route::middleware('api')->get('api/v1/_test/ok', fn () => response()->json(['data' => []]));
    config(['mes.hsts.include_subdomains' => true, 'mes.hsts.max_age' => 600]);

    $response = $this->getJson('api/v1/_test/ok');

    $response->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=600; includeSubDomains');
});

it('omits Strict-Transport-Security when the max age is zero', function (): void {
    Route::middleware('api')->get('api/v1/_test/ok', fn () => response()->json(['data' => []]));
    config(['mes.hsts.max_age' => 0]);

    $response = $this->getJson('api/v1/_test/ok');

    $response->assertOk()->assertHeaderMissing('Strict-Transport-Security');
});
