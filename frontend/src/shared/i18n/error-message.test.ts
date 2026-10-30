import { describe, expect, it } from 'vitest';
import { HttpError } from '@/shared/api/http-error';
import { getErrorMessage } from './error-message';
import { changeUiLanguage } from './i18n';

function createError(code: string): HttpError {
	return new HttpError({ status: 422, code, message: 'Komunikat z API' });
}

describe('getErrorMessage', () => {
	it('returns the API message unchanged for a server code', () => {
		expect(getErrorMessage(createError('TIME_IN_FUTURE'))).toBe(
			'Komunikat z API',
		);
	});

	it('does not translate a server code after switching language', async () => {
		await changeUiLanguage('en');

		expect(getErrorMessage(createError('TIME_IN_FUTURE'))).toBe(
			'Komunikat z API',
		);
	});

	it('translates NETWORK_ERROR to the UI language', async () => {
		expect(getErrorMessage(createError('NETWORK_ERROR'))).toBe(
			'Brak połączenia z serwerem.',
		);

		await changeUiLanguage('en');

		expect(getErrorMessage(createError('NETWORK_ERROR'))).toBe(
			'Cannot reach the server.',
		);
	});

	it('translates INVALID_RESPONSE to the UI language', async () => {
		await changeUiLanguage('en');

		expect(getErrorMessage(createError('INVALID_RESPONSE'))).toBe(
			'Something went wrong. Please try again shortly.',
		);
	});

	it('returns the API message for inherited object keys', () => {
		expect(getErrorMessage(createError('constructor'))).toBe('Komunikat z API');
	});
});
