<?php

declare(strict_types=1);

namespace App\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class PlantSettings
{
    public const int MAX_BREAKS = 5;

    public const int MAX_BACKDATE_DAYS = 5;

    public const int MIN_IDLE_LOGOUT_MINUTES = 1;

    public const int MAX_IDLE_LOGOUT_MINUTES = 60;

    public const int MAX_ALLOWED_NETWORKS = 20;

    /**
     * Creates plant settings and rejects values that break the invariants of the settings contract.
     *
     * @param  list<BreakWindow>  $breaks
     * @param  list<string>  $workerAllowedNetworks
     *
     * @throws InvalidArgumentException
     */
    public function __construct(
        public string $shiftStart,
        public string $shiftEnd,
        public array $breaks,
        public bool $deductBreaks,
        public bool $autoPauseEnabled,
        public int $workerBackdateDays,
        public int $stationIdleLogoutMinutes,
        public bool $workerNetworkRestrictionEnabled,
        public array $workerAllowedNetworks,
    ) {
        foreach ([$shiftStart, $shiftEnd] as $shiftTime) {
            if (preg_match(BreakWindow::TIME_PATTERN, $shiftTime) !== 1) {
                throw new InvalidArgumentException("Invalid shift time: {$shiftTime}.");
            }
        }

        if ($shiftEnd <= $shiftStart) {
            throw new InvalidArgumentException('Shift must end after it starts.');
        }

        self::assertBreaksFitShift($breaks, $shiftStart, $shiftEnd);

        if ($workerBackdateDays < 0 || $workerBackdateDays > self::MAX_BACKDATE_DAYS) {
            throw new InvalidArgumentException('Backdate days out of range.');
        }

        if ($stationIdleLogoutMinutes < self::MIN_IDLE_LOGOUT_MINUTES || $stationIdleLogoutMinutes > self::MAX_IDLE_LOGOUT_MINUTES) {
            throw new InvalidArgumentException('Idle logout minutes out of range.');
        }

        if (count($workerAllowedNetworks) > self::MAX_ALLOWED_NETWORKS) {
            throw new InvalidArgumentException('Too many allowed networks.');
        }

        if ($workerNetworkRestrictionEnabled && $workerAllowedNetworks === []) {
            throw new InvalidArgumentException('Network restriction requires at least one allowed network.');
        }
    }

    /**
     * @param  list<BreakWindow>  $breaks
     */
    private static function assertBreaksFitShift(array $breaks, string $shiftStart, string $shiftEnd): void
    {
        if (count($breaks) > self::MAX_BREAKS) {
            throw new InvalidArgumentException('Too many breaks.');
        }

        $sortedBreaks = $breaks;
        usort($sortedBreaks, static fn (BreakWindow $a, BreakWindow $b): int => $a->start <=> $b->start);

        $previousEnd = $shiftStart;
        foreach ($sortedBreaks as $break) {
            if ($break->start < $previousEnd || $break->end > $shiftEnd) {
                throw new InvalidArgumentException('Breaks must lie within the shift and not overlap.');
            }
            $previousEnd = $break->end;
        }
    }
}
