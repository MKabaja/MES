<?php

declare(strict_types=1);

use App\Domain\Enums\ErrorCode;
use App\Domain\Exceptions\DomainException;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;

beforeEach(function (): void {
    Route::middleware('api')->get('api/v1/_test/domain', fn () => throw new DomainException(ErrorCode::OrderLocked));
    Route::middleware('api')->post('api/v1/_test/validate', function (): void {
        Validator::make(request()->all(), ['name' => ['required']])->validate();
    });
});

it('answers domain errors in the language from Accept-Language', function (array $headers, string $message): void {
    $response = $this->getJson('api/v1/_test/domain', $headers);

    $response->assertConflict()
        ->assertExactJson(['message' => $message, 'code' => 'ORDER_LOCKED']);
})->with([
    'no header' => [['Accept-Language' => ''], 'Zlecenie jest zablokowane.'],
    'english with region and quality' => [['Accept-Language' => 'en-US,en;q=0.9'], 'The order is locked.'],
    'english preferred over polish' => [['Accept-Language' => 'pl;q=0.3, en;q=0.8'], 'The order is locked.'],
    'unsupported language' => [['Accept-Language' => 'de-DE,de;q=0.9'], 'Zlecenie jest zablokowane.'],
]);

it('answers validation errors in the language from Accept-Language', function (array $headers, string $envelopeMessage, string $fieldMessage): void {
    $response = $this->postJson('api/v1/_test/validate', [], $headers);

    $response->assertUnprocessable()
        ->assertExactJson([
            'message' => $envelopeMessage,
            'code' => 'VALIDATION_FAILED',
            'errors' => ['name' => [$fieldMessage]],
        ]);
})->with([
    'no header' => [['Accept-Language' => ''], 'Dane są nieprawidłowe.', 'Pole name jest wymagane.'],
    'english' => [['Accept-Language' => 'en'], 'The data is invalid.', 'The name field is required.'],
]);

it('has exactly the known error codes translated', function (string $locale): void {
    $translatedCodes = array_keys(trans()->get('errors', [], $locale));
    $knownCodes = array_map(fn (ErrorCode $code) => $code->value, ErrorCode::cases());

    expect($translatedCodes)->toEqualCanonicalizing($knownCodes);
})->with(['pl', 'en']);

it('substitutes placeholders in a domain error message', function (): void {
    app()->setLocale('en');
    app('translator')->addLines(['errors.SEGMENT_OVERLAP' => 'Overlaps :position.'], 'en');

    $exception = new DomainException(ErrorCode::SegmentOverlap, replace: ['position' => 'ZP/12/10/2026 (S)']);

    expect($exception->getMessage())->toBe('Overlaps ZP/12/10/2026 (S).');
});
