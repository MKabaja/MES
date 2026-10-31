<?php

declare(strict_types=1);

namespace App\Data;

use App\Domain\ValueObjects\BreakWindow;
use App\Domain\ValueObjects\PlantSettings;
use InvalidArgumentException;

final readonly class SettingsData
{
    /**
     * @param  list<BreakWindow>  $breaks
     * @param  list<string>  $workerAllowedNetworks
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
    ) {}

    /**
     * Builds the plant settings, which enforce the invariants of the settings contract.
     *
     * @throws InvalidArgumentException
     */
    public function toPlantSettings(): PlantSettings
    {
        return new PlantSettings(
            shiftStart: $this->shiftStart,
            shiftEnd: $this->shiftEnd,
            breaks: $this->breaks,
            deductBreaks: $this->deductBreaks,
            autoPauseEnabled: $this->autoPauseEnabled,
            workerBackdateDays: $this->workerBackdateDays,
            stationIdleLogoutMinutes: $this->stationIdleLogoutMinutes,
            workerNetworkRestrictionEnabled: $this->workerNetworkRestrictionEnabled,
            workerAllowedNetworks: $this->workerAllowedNetworks,
        );
    }
}
