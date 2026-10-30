import { describe, expect, it } from 'vitest';
import { HttpError } from '@/shared/api/http-error';
import { getErrorMessage } from './error-message';
import { changeUiLanguage } from './i18n';

function createError(code: string): HttpError {
	return new HttpError({ status: 422, code, message: 'Komunikat z API' });
}

describe('getErrorMessage', () => {
	it('translates a known code to Polish', () => {
		expect(getErrorMessage(createError('TIME_IN_FUTURE'))).toBe(
			'Godzina nie może być w przyszłości.',
		);
	});

	it('translates a known code to English after switching language', async () => {
		await changeUiLanguage('en');

		expect(getErrorMessage(createError('TIME_IN_FUTURE'))).toBe(
			'The time cannot be in the future.',
		);
	});

	it('falls back to the API message for an unknown code', () => {
		expect(getErrorMessage(createError('SOMETHING_NEW'))).toBe(
			'Komunikat z API',
		);
	});

	it('does not treat inherited object keys as translations', () => {
		expect(getErrorMessage(createError('constructor'))).toBe('Komunikat z API');
	});
});
