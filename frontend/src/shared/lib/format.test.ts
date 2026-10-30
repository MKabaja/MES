import { afterEach, describe, expect, it } from 'vitest';
import { setUiLanguageReader } from '@/shared/config/app.config';
import { formatMoney, formatQuantity, toQuantityString } from './format';

const NBSP = ' ';

afterEach(() => {
	setUiLanguageReader(() => 'pl');
});

describe('formatMoney', () => {
	it('formats with space grouping, decimal comma and zł', () => {
		expect(formatMoney('1234.50')).toBe(`1${NBSP}234,50${NBSP}zł`);
	});

	it('groups four-digit amounts despite Polish minimum grouping rules', () => {
		expect(formatMoney('9999.99')).toBe(`9${NBSP}999,99${NBSP}zł`);
	});

	it('keeps two decimals for whole and small amounts', () => {
		expect(formatMoney('150.00')).toBe(`150,00${NBSP}zł`);
		expect(formatMoney('0.05')).toBe(`0,05${NBSP}zł`);
	});

	it('formats negative amounts', () => {
		expect(formatMoney('-12.30')).toBe(`-12,30${NBSP}zł`);
	});

	it('does not show a minus sign for amounts that round to zero', () => {
		expect(formatMoney('-0.00')).toBe(`0,00${NBSP}zł`);
		expect(formatMoney('-0.001')).toBe(`0,00${NBSP}zł`);
	});

	it('does not lose precision on values beyond double range', () => {
		expect(formatMoney('12345678901234567890.12')).toBe(
			`12${NBSP}345${NBSP}678${NBSP}901${NBSP}234${NBSP}567${NBSP}890,12${NBSP}zł`,
		);
	});

	it('rounds half up to two decimals', () => {
		expect(formatMoney('1.005')).toBe(`1,01${NBSP}zł`);
	});

	it('uses English separators when the UI language is English', () => {
		setUiLanguageReader(() => 'en');

		expect(formatMoney('1234.50')).toBe(`PLN${NBSP}1,234.50`);
	});

	it.each(['', ' ', 'abc', '1,50', '1.2.3', 'NaN', 'Infinity', '1e3'])(
		'returns a dash for %j',
		(value) => {
			expect(formatMoney(value)).toBe('—');
		},
	);
});

describe('formatQuantity', () => {
	it('drops trailing zeros', () => {
		expect(formatQuantity('26.000', 'kg')).toBe(`26${NBSP}kg`);
		expect(formatQuantity('1.500', 'kg')).toBe(`1,5${NBSP}kg`);
	});

	it('uses a decimal comma', () => {
		expect(formatQuantity('0.500', 'm')).toBe(`0,5${NBSP}m`);
		expect(formatQuantity('0.125', 'm')).toBe(`0,125${NBSP}m`);
	});

	it('groups thousands', () => {
		expect(formatQuantity('1234.000', 'szt')).toBe(`1${NBSP}234${NBSP}szt`);
	});

	it('does not show a minus sign for quantities that round to zero', () => {
		expect(formatQuantity('-0.000', 'kg')).toBe(`0${NBSP}kg`);
		expect(formatQuantity('-0.0001', 'kg')).toBe(`0${NBSP}kg`);
	});

	it('shows zero', () => {
		expect(formatQuantity('0.000', 'szt')).toBe(`0${NBSP}szt`);
	});

	it('uses a decimal point when the UI language is English', () => {
		setUiLanguageReader(() => 'en');

		expect(formatQuantity('1234.500', 'kg')).toBe(`1,234.5${NBSP}kg`);
	});

	it.each(['', 'abc', '0,5', '-'])('returns a dash for %j', (value) => {
		expect(formatQuantity(value, 'kg')).toBe('—');
	});
});

describe('toQuantityString', () => {
	it.each([
		['0,5', '0.500'],
		['0.5', '0.500'],
		['26', '26.000'],
		['1,25', '1.250'],
		['1.234', '1.234'],
		['007', '7.000'],
		['0', '0.000'],
		['  3,5 ', '3.500'],
		['1 000,5', '1000.500'],
	])('normalizes %j to %s', (input, expected) => {
		expect(toQuantityString(input)).toBe(expected);
	});

	it.each([
		'',
		' ',
		',',
		'.5',
		'5.',
		'-1',
		'1,2,3',
		'1.2.3',
		'1,2345',
		'abc',
		'1e3',
		'1,5kg',
	])('rejects %j', (input) => {
		expect(toQuantityString(input)).toBeNull();
	});
});
