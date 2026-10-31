<?php

declare(strict_types=1);

namespace App\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class BreakWindow
{
    public const string TIME_PATTERN = '/^([01]\d|2[0-3]):[0-5]\d\z/';

    /**
     * Creates a break from two `HH:MM` times of the same day.
     *
     * @throws InvalidArgumentException when a time is malformed or the end is not later than the start
     */
    public function __construct(
        public string $start,
        public string $end,
    ) {
        foreach ([$start, $end] as $time) {
            if (preg_match(self::TIME_PATTERN, $time) !== 1) {
                throw new InvalidArgumentException("Invalid time: {$time}.");
            }
        }

        if ($end <= $start) {
            throw new InvalidArgumentException('Break must end after it starts.');
        }
    }
}
