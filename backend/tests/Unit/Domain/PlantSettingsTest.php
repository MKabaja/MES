<?php

declare(strict_types=1);

use App\Domain\ValueObjects\BreakWindow;
use App\Domain\ValueObjects\PlantSettings;

function plantSettings(
    string $shiftStart = '06:00',
    string $shiftEnd = '14:00',
    array $breaks = [],
    int $backdateDays = 2,
    int $idleMinutes = 5,
    bool $restricted = false,
    array $networks = [],
): PlantSettings {
    return new PlantSettings($shiftStart, $shiftEnd, $breaks, true, true, $backdateDays, $idleMinutes, $restricted, $networks);
}

it('rejects a shift that does not end after it starts', function (): void {
    plantSettings(shiftStart: '14:00', shiftEnd: '14:00');
})->throws(InvalidArgumentException::class);

it('rejects a break outside the shift', function (): void {
    plantSettings(breaks: [new BreakWindow('13:50', '14:10')]);
})->throws(InvalidArgumentException::class);

it('rejects overlapping breaks', function (): void {
    plantSettings(breaks: [new BreakWindow('10:00', '10:30'), new BreakWindow('10:15', '10:45')]);
})->throws(InvalidArgumentException::class);

it('accepts adjacent breaks given out of order', function (): void {
    $settings = plantSettings(breaks: [new BreakWindow('10:15', '10:30'), new BreakWindow('10:00', '10:15')]);

    expect($settings->breaks)->toHaveCount(2);
});

it('rejects more than five breaks', function (): void {
    $breaks = array_map(
        fn (int $hour): BreakWindow => new BreakWindow(sprintf('%02d:00', $hour), sprintf('%02d:10', $hour)),
        [7, 8, 9, 10, 11, 12],
    );

    plantSettings(breaks: $breaks);
})->throws(InvalidArgumentException::class);

it('rejects out-of-range numeric settings', function (int $backdateDays, int $idleMinutes): void {
    plantSettings(backdateDays: $backdateDays, idleMinutes: $idleMinutes);
})->with([
    'negative backdate' => [-1, 5],
    'backdate above limit' => [6, 5],
    'idle below limit' => [2, 0],
    'idle above limit' => [2, 61],
])->throws(InvalidArgumentException::class);

it('rejects enabled network restriction with an empty allow list', function (): void {
    plantSettings(restricted: true, networks: []);
})->throws(InvalidArgumentException::class);

it('rejects more than twenty allowed networks', function (): void {
    plantSettings(networks: array_fill(0, 21, '10.0.0.1'));
})->throws(InvalidArgumentException::class);

it('rejects malformed times', function (string $time): void {
    new BreakWindow($time, '11:00');
})->with(['seconds' => '10:00:00', 'no leading zero' => '9:00', 'hour 25' => '25:00'])
    ->throws(InvalidArgumentException::class);

it('rejects malformed shift times', function (string $time): void {
    plantSettings(shiftStart: $time);
})->with(['seconds' => '10:00:00', 'no leading zero' => '9:00'])
    ->throws(InvalidArgumentException::class);

it('accepts boundary values', function (array $overrides): void {
    expect(plantSettings(...$overrides))->toBeInstanceOf(PlantSettings::class);
})->with([
    'backdate 0' => [['backdateDays' => 0]],
    'backdate 5' => [['backdateDays' => 5]],
    'idle 1' => [['idleMinutes' => 1]],
    'idle 60' => [['idleMinutes' => 60]],
    'exactly 20 networks' => [['networks' => array_fill(0, 20, '10.0.0.1')]],
    'exactly 5 breaks' => [['breaks' => [
        new BreakWindow('07:00', '07:10'), new BreakWindow('08:00', '08:10'), new BreakWindow('09:00', '09:10'),
        new BreakWindow('10:00', '10:10'), new BreakWindow('11:00', '11:10'),
    ]]],
    'break spanning the whole shift' => [['breaks' => [new BreakWindow('06:00', '14:00')]]],
    'adjacent breaks' => [['breaks' => [new BreakWindow('10:00', '10:15'), new BreakWindow('10:15', '10:30')]]],
]);
