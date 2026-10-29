<?php

declare(strict_types=1);

namespace App\Domain\Enums;

enum ErrorCode: string
{
    case Unauthenticated = 'UNAUTHENTICATED';
    case Forbidden = 'FORBIDDEN';
    case NotFound = 'NOT_FOUND';
    case CsrfMismatch = 'CSRF_MISMATCH';
    case ValidationFailed = 'VALIDATION_FAILED';
    case TooManyRequests = 'TOO_MANY_REQUESTS';
    case ServerError = 'SERVER_ERROR';
    case InvalidCredentials = 'INVALID_CREDENTIALS';
    case AccountInactive = 'ACCOUNT_INACTIVE';
    case NetworkNotAllowed = 'NETWORK_NOT_ALLOWED';
    case CodeNotFound = 'CODE_NOT_FOUND';
    case OrderNotDraft = 'ORDER_NOT_DRAFT';
    case OrderHasNoPositions = 'ORDER_HAS_NO_POSITIONS';
    case OrderHasOpenSegments = 'ORDER_HAS_OPEN_SEGMENTS';
    case OrderLocked = 'ORDER_LOCKED';
    case OrderNotActive = 'ORDER_NOT_ACTIVE';
    case PositionCompleted = 'POSITION_COMPLETED';
    case PositionHasWork = 'POSITION_HAS_WORK';
    case AlreadyWorking = 'ALREADY_WORKING';
    case NoOpenSegment = 'NO_OPEN_SEGMENT';
    case UserHasOpenSegment = 'USER_HAS_OPEN_SEGMENT';
    case IdempotencyKeyReused = 'IDEMPOTENCY_KEY_REUSED';
    case TimeInFuture = 'TIME_IN_FUTURE';
    case TimeBeforePosition = 'TIME_BEFORE_POSITION';
    case TimeTooFarBack = 'TIME_TOO_FAR_BACK';
    case TimeEndBeforeStart = 'TIME_END_BEFORE_START';
    case SegmentOverlap = 'SEGMENT_OVERLAP';

    /**
     * Returns the HTTP status the API contract assigns to this error code.
     */
    public function status(): int
    {
        return match ($this) {
            self::Unauthenticated => 401,
            self::Forbidden,
            self::AccountInactive,
            self::NetworkNotAllowed => 403,
            self::NotFound,
            self::CodeNotFound => 404,
            self::OrderNotDraft,
            self::OrderHasNoPositions,
            self::OrderHasOpenSegments,
            self::OrderLocked,
            self::OrderNotActive,
            self::PositionCompleted,
            self::PositionHasWork,
            self::AlreadyWorking,
            self::NoOpenSegment,
            self::UserHasOpenSegment,
            self::IdempotencyKeyReused => 409,
            self::CsrfMismatch => 419,
            self::ValidationFailed,
            self::InvalidCredentials,
            self::TimeInFuture,
            self::TimeBeforePosition,
            self::TimeTooFarBack,
            self::TimeEndBeforeStart,
            self::SegmentOverlap => 422,
            self::TooManyRequests => 429,
            self::ServerError => 500,
        };
    }
}
