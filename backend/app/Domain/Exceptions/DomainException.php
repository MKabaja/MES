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
     * Creates an error with a Polish message and an optional field that receives it under `errors`.
     */
    public function __construct(
        public readonly ErrorCode $errorCode,
        string $message,
        public readonly ?string $field = null,
    ) {
        parent::__construct($message);
    }
}
