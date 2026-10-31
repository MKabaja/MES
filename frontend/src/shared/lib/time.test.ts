import { describe, expect, it } from 'vitest';
import {
	formatClock,
	formatDate,
	formatDateTime,
	formatDuration,
	formatTime,
	fromPlantIso,
	toPlantIso,
} from './time';

describe('formatDateTime / formatTime / formatDate', () => {
	it('shows winter time as UTC+1', () => {
		expect(formatDateTime('2026-01-15T10:30:00Z')).toBe('15.01.2026 11:30');
		expect(formatTime('2026-01-15T10:30:00Z')).toBe('11:30');
		expect(formatDate('2026-01-15T10:30:00Z')).toBe('15.01.2026');
	});

	it('shows summer time as UTC+2', () => {
		expect(formatDateTime('2026-07-15T10:30:00Z')).toBe('15.07.2026 12:30');
	});

	it('rolls the date forward when UTC evening is already the next plant day', () => {
		expect(formatDate('2026-01-15T23:30:00Z')).toBe('16.01.2026');
		expect(formatDate('2026-07-15T22:00:00Z')).toBe('16.07.2026');
	});

	it('keeps the plant day at plant midnight regardless of UTC date', () => {
		expect(formatDateTime('2026-07-14T22:00:00Z')).toBe('15.07.2026 00:00');
		expect(formatDateTime('2026-07-14T21:59:59Z')).toBe('14.07.2026 23:59');
	});

	it('switches offset at the spring change on 29.03.2026 (01:00 UTC)', () => {
		expect(formatTime('2026-03-29T00:59:59Z')).toBe('01:59');
		expect(formatTime('2026-03-29T01:00:00Z')).toBe('03:00');
	});

	it('switches offset at the autumn change on 25.10.2026 (01:00 UTC)', () => {
		expect(formatTime('2026-10-25T00:59:59Z')).toBe('02:59');
		expect(formatTime('2026-10-25T01:00:00Z')).toBe('02:00');
		expect(formatTime('2026-10-25T01:30:00Z')).toBe('02:30');
	});

	it.each(['', 'not a date', '2026-13-45T00:00:00Z'])(
		'returns a dash for %j',
		(value) => {
			expect(formatDateTime(value)).toBe('—');
			expect(formatTime(value)).toBe('—');
			expect(formatDate(value)).toBe('—');
		},
	);
});

describe('formatDuration', () => {
	it.each([
		[0, '< 1 min'],
		[59, '< 1 min'],
		[60, '1 min'],
		[2700, '45 min'],
		[3600, '1 h'],
		[3660, '1 h 1 min'],
		[26712, '7 h 25 min'],
		[26759, '7 h 25 min'],
		[360000, '100 h'],
	])('formats %i s as %s', (seconds, expected) => {
		expect(formatDuration(seconds)).toBe(expected);
	});

	it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
		'returns a dash for %s',
		(seconds) => {
			expect(formatDuration(seconds)).toBe('—');
		},
	);
});

describe('formatClock', () => {
	it.each([
		[0, '00:00:00'],
		[9, '00:00:09'],
		[26712, '07:25:12'],
		[86399, '23:59:59'],
		[90061, '25:01:01'],
		[61.9, '00:01:01'],
	])('formats %s s as %s', (seconds, expected) => {
		expect(formatClock(seconds)).toBe(expected);
	});

	it.each([-5, Number.NaN])('returns a dash for %s', (seconds) => {
		expect(formatClock(seconds)).toBe('—');
	});
});

describe('toPlantIso', () => {
	it('converts winter plant time to UTC', () => {
		expect(toPlantIso('2026-01-15', '07:00')).toBe('2026-01-15T06:00:00Z');
	});

	it('converts summer plant time to UTC', () => {
		expect(toPlantIso('2026-07-15', '07:00')).toBe('2026-07-15T05:00:00Z');
	});

	it('maps plant midnight to the previous UTC day', () => {
		expect(toPlantIso('2026-07-15', '00:00')).toBe('2026-07-14T22:00:00Z');
		expect(toPlantIso('2026-01-15', '00:00')).toBe('2026-01-14T23:00:00Z');
	});

	it('handles the day of the spring change on 29.03.2026', () => {
		expect(toPlantIso('2026-03-29', '01:59')).toBe('2026-03-29T00:59:00Z');
		expect(toPlantIso('2026-03-29', '03:00')).toBe('2026-03-29T01:00:00Z');
	});

	it('rejects the skipped hour of the spring change', () => {
		expect(() => toPlantIso('2026-03-29', '02:30')).toThrow(RangeError);
	});

	it('uses the earlier occurrence of the repeated hour on 25.10.2026', () => {
		expect(toPlantIso('2026-10-25', '02:30')).toBe('2026-10-25T00:30:00Z');
		expect(toPlantIso('2026-10-25', '03:00')).toBe('2026-10-25T02:00:00Z');
	});

	it.each([
		['2026-02-30', '10:00'],
		['2026-13-01', '10:00'],
		['2026-01-15', '24:00'],
		['2026-01-15', '10:60'],
		['15.01.2026', '10:00'],
		['2026-01-15', '7:00'],
		['', ''],
	])('rejects %s %s', (date, time) => {
		expect(() => toPlantIso(date, time)).toThrow(RangeError);
	});
});

describe('device time zone', () => {
	it('is not the plant time zone, so plant formatting is really exercised', () => {
		expect(new Date('2026-07-15T12:00:00Z').getHours()).toBe(8);
	});
});

describe('toPlantIso around the autumn change on 25.10.2026', () => {
	it.each([
		['01:59', '2026-10-24T23:59:00Z'],
		['02:00', '2026-10-25T00:00:00Z'],
		['02:59', '2026-10-25T00:59:00Z'],
	])('maps %s to %s', (time, expected) => {
		expect(toPlantIso('2026-10-25', time)).toBe(expected);
	});
});

describe('fromPlantIso around DST changes', () => {
	it('maps both occurrences of the repeated hour to 02:30', () => {
		expect(fromPlantIso('2026-10-25T00:30:00Z')).toEqual({
			localDate: '2026-10-25',
			localTime: '02:30',
		});
		expect(fromPlantIso('2026-10-25T01:30:00Z')).toEqual({
			localDate: '2026-10-25',
			localTime: '02:30',
		});
	});

	it('jumps from 01:59 to 03:00 at the spring change', () => {
		expect(fromPlantIso('2026-03-29T00:59:59Z')).toEqual({
			localDate: '2026-03-29',
			localTime: '01:59',
		});
		expect(fromPlantIso('2026-03-29T01:00:00Z')).toEqual({
			localDate: '2026-03-29',
			localTime: '03:00',
		});
	});
});

describe('fromPlantIso', () => {
	it('returns plant-local date and time', () => {
		expect(fromPlantIso('2026-07-14T22:00:00Z')).toEqual({
			localDate: '2026-07-15',
			localTime: '00:00',
		});
		expect(fromPlantIso('2026-01-15T06:00:00Z')).toEqual({
			localDate: '2026-01-15',
			localTime: '07:00',
		});
	});

	it('returns null for an unparsable value', () => {
		expect(fromPlantIso('nope')).toBeNull();
	});

	it('round-trips with toPlantIso outside DST ambiguity', () => {
		const iso = toPlantIso('2026-11-02', '13:45');
		const local = fromPlantIso(iso);

		expect(local).toEqual({ localDate: '2026-11-02', localTime: '13:45' });
	});
});
