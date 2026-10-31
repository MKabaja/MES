<?php

declare(strict_types=1);

namespace App\Domain\Exceptions;

use App\Domain\Enums\ErrorCode;
use RuntimeException;

/**
 * Business rule violation that the API renders with the status of its error code.
 */
final class DomainException extends RuntimeException
{
    /**
     * Creates an error with the message of its code in the current locale and an optional field that receives it under `errors`.
     *
     * @param  array<string, string|int>  $replace
     */
    public function __construct(
        public readonly ErrorCode $errorCode,
        public readonly ?string $field = null,
        array $replace = [],
    ) {
        parent::__construct($errorCode->message($replace));
    }
}
