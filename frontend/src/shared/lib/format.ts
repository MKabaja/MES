import { getFormatLocale } from '@/shared/config/app.config';
import { EMPTY_VALUE } from '@/shared/lib/format.constants';

const NON_NEGATIVE_DECIMAL_INPUT = /^\d+(?:[.,]\d{1,3})?$/;
const DECIMAL_STRING = /^-?\d+(?:\.\d+)?$/;
const QUANTITY_FRACTION_DIGITS = 3;
const NON_BREAKING_SPACE = ' ';

type DecimalString = `${number}`;

type NumberFormatByLocale = Map<string, Intl.NumberFormat>;

const moneyFormatByLocale: NumberFormatByLocale = new Map();
const quantityFormatByLocale: NumberFormatByLocale = new Map();

/**
 * Formats a decimal string from the API as PLN, e.g. `"1234.50"` as `1 234,50 zł` in Polish.
 * Digits are passed to `Intl.NumberFormat` as a string, so precision is not lost; empty or invalid input yields `—`.
 */
export function formatMoney(amount: string): string {
	if (!isDecimalString(amount)) {
		return EMPTY_VALUE;
	}
	return getMoneyFormat().format(amount);
}

/**
 * Formats a decimal string quantity with its unit, dropping trailing zeros, e.g. `"26.000"` as `26 kg`.
 * Empty or invalid input yields `—`.
 */
export function formatQuantity(quantity: string, unit: string): string {
	if (!isDecimalString(quantity)) {
		return EMPTY_VALUE;
	}
	return `${getQuantityFormat().format(quantity)}${NON_BREAKING_SPACE}${unit}`;
}

/**
 * Normalizes a typed quantity (comma or dot, spaces allowed) to the API format `"0.500"`.
 * Returns `null` for empty, negative, non-numeric input or more than 3 decimal places.
 */
export function toQuantityString(input: string): string | null {
	const compact = input.replace(/\s/g, '');
	if (!NON_NEGATIVE_DECIMAL_INPUT.test(compact)) {
		return null;
	}

	const [integerPart = '', fractionPart = ''] = compact.split(/[.,]/);
	const integer = integerPart.replace(/^0+(?=\d)/, '');
	return `${integer}.${fractionPart.padEnd(QUANTITY_FRACTION_DIGITS, '0')}`;
}

function isDecimalString(value: string): value is DecimalString {
	return DECIMAL_STRING.test(value);
}

function getMoneyFormat(): Intl.NumberFormat {
	const locale = getFormatLocale();
	const cached = moneyFormatByLocale.get(locale);
	if (cached) {
		return cached;
	}
	const created = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'PLN',
		useGrouping: 'always',
		signDisplay: 'negative',
	});
	moneyFormatByLocale.set(locale, created);
	return created;
}

function getQuantityFormat(): Intl.NumberFormat {
	const locale = getFormatLocale();
	const cached = quantityFormatByLocale.get(locale);
	if (cached) {
		return cached;
	}
	const created = new Intl.NumberFormat(locale, {
		maximumFractionDigits: QUANTITY_FRACTION_DIGITS,
		useGrouping: 'always',
		signDisplay: 'negative',
	});
	quantityFormatByLocale.set(locale, created);
	return created;
}
