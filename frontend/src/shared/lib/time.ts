import { tz, tzOffset } from '@date-fns/tz';
import { format, isValid } from 'date-fns';
import { PLANT_TIMEZONE } from '@/shared/config/app.config';
import { EMPTY_VALUE } from '@/shared/lib/format.constants';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_DAY = 86_400_000;
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export type PlantDateTime = {
	localDate: string;
	localTime: string;
};

/**
 * Formats a UTC ISO instant as `dd.MM.yyyy HH:mm` in the plant time zone.
 * Returns `—` for an unparsable value.
 */
export function formatDateTime(iso: string): string {
	return formatInPlantZone(iso, 'dd.MM.yyyy HH:mm');
}

/**
 * Formats a UTC ISO instant as `HH:mm` in the plant time zone.
 * Returns `—` for an unparsable value.
 */
export function formatTime(iso: string): string {
	return formatInPlantZone(iso, 'HH:mm');
}

/**
 * Formats a UTC ISO instant as `dd.MM.yyyy` in the plant time zone.
 * Returns `—` for an unparsable value.
 */
export function formatDate(iso: string): string {
	return formatInPlantZone(iso, 'dd.MM.yyyy');
}

/**
 * Formats a duration in seconds as `7 h 25 min`, `45 min` or `< 1 min`.
 * Seconds are truncated to whole minutes; negative or non-finite input yields `—`.
 */
export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return EMPTY_VALUE;
	}

	const totalMinutes = Math.floor(seconds / SECONDS_PER_MINUTE);
	const hours = Math.floor(totalMinutes / SECONDS_PER_MINUTE);
	const minutes = totalMinutes % SECONDS_PER_MINUTE;

	if (hours === 0 && minutes === 0) {
		return '< 1 min';
	}
	if (hours === 0) {
		return `${minutes} min`;
	}
	if (minutes === 0) {
		return `${hours} h`;
	}
	return `${hours} h ${minutes} min`;
}

/**
 * Formats a duration in seconds as a `HH:mm:ss` clock; hours may exceed 24.
 * Negative or non-finite input yields `—`.
 */
export function formatClock(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return EMPTY_VALUE;
	}

	const wholeSeconds = Math.floor(seconds);
	const hours = Math.floor(wholeSeconds / SECONDS_PER_HOUR);
	const minutes = Math.floor(
		(wholeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
	);
	const remainingSeconds = wholeSeconds % SECONDS_PER_MINUTE;

	return [hours, minutes, remainingSeconds].map(padTwoDigits).join(':');
}

/**
 * Converts a plant-local date (`yyyy-MM-dd`) and time (`HH:mm`) to a UTC ISO string ending in `Z`.
 *
 * @throws {@link RangeError} when the input is malformed, does not exist (e.g. `30 February`)
 * or falls into the skipped hour of the spring DST change.
 * During the autumn DST change the earlier of the two occurrences is used.
 */
export function toPlantIso(localDate: string, localTime: string): string {
	const dateMatch = LOCAL_DATE_PATTERN.exec(localDate);
	const timeMatch = LOCAL_TIME_PATTERN.exec(localTime);
	if (!dateMatch || !timeMatch) {
		throw new RangeError(
			`Invalid plant date or time: ${localDate} ${localTime}`,
		);
	}

	const wallClockAsUtc = Date.UTC(
		Number(dateMatch[1]),
		Number(dateMatch[2]) - 1,
		Number(dateMatch[3]),
		Number(timeMatch[1]),
		Number(timeMatch[2]),
	);
	const wallClock = `${localDate} ${localTime}`;
	const earliestMatch = findPlantInstantCandidates(wallClockAsUtc)
		.filter(
			(instant) =>
				formatInstantInPlantZone(instant, 'yyyy-MM-dd HH:mm') === wallClock,
		)
		.sort((first, second) => first.getTime() - second.getTime())[0];
	if (!earliestMatch) {
		throw new RangeError(`Nonexistent plant date or time: ${wallClock}`);
	}

	return earliestMatch.toISOString().replace('.000Z', 'Z');
}

/**
 * Converts a UTC ISO instant to the plant-local date (`yyyy-MM-dd`) and time (`HH:mm`).
 * Returns `null` for an unparsable value.
 */
export function fromPlantIso(iso: string): PlantDateTime | null {
	const instant = new Date(iso);
	if (!isValid(instant)) {
		return null;
	}

	return {
		localDate: formatInstantInPlantZone(instant, 'yyyy-MM-dd'),
		localTime: formatInstantInPlantZone(instant, 'HH:mm'),
	};
}

function findPlantInstantCandidates(wallClockAsUtc: number): Date[] {
	const offsetsInMinutes = [-MILLISECONDS_PER_DAY, MILLISECONDS_PER_DAY].map(
		(shift) => tzOffset(PLANT_TIMEZONE, new Date(wallClockAsUtc + shift)),
	);
	return offsetsInMinutes.map(
		(offset) => new Date(wallClockAsUtc - offset * MILLISECONDS_PER_MINUTE),
	);
}

function formatInPlantZone(iso: string, pattern: string): string {
	const instant = new Date(iso);
	if (!isValid(instant)) {
		return EMPTY_VALUE;
	}
	return formatInstantInPlantZone(instant, pattern);
}

function formatInstantInPlantZone(instant: Date, pattern: string): string {
	return format(instant, pattern, { in: tz(PLANT_TIMEZONE) });
}

function padTwoDigits(value: number): string {
	return String(value).padStart(2, '0');
}
