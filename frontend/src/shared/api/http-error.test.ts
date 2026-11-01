import { describe, expect, it } from 'vitest';
import { HttpError, parseApiError } from './http-error';

describe('parseApiError', () => {
	it('keeps code, message and field errors from the envelope', () => {
		const error = parseApiError(422, {
			message: 'Błąd',
			code: 'VALIDATION_FAILED',
			errors: { 'materials.0.quantity': ['Za mało'] },
		});

		expect(error).toBeInstanceOf(HttpError);
		expect(error).toMatchObject({
			status: 422,
			code: 'VALIDATION_FAILED',
			message: 'Błąd',
			fieldErrors: { 'materials.0.quantity': ['Za mało'] },
		});
	});

	it('defaults field errors to an empty object', () => {
		expect(
			parseApiError(404, { message: 'x', code: 'NOT_FOUND' }).fieldErrors,
		).toEqual({});
	});

	it.each([null, 'text', { message: 'x' }, { code: 'X' }])(
		'falls back to SERVER_ERROR for %j',
		(body) => {
			expect(parseApiError(500, body)).toMatchObject({
				status: 500,
				code: 'SERVER_ERROR',
			});
		},
	);
});

describe('parseApiError Retry-After', () => {
	const envelope = { message: 'Za dużo prób.', code: 'TOO_MANY_REQUESTS' };

	it('reads a whole number of seconds', () => {
		expect(parseApiError(429, envelope, '600').retryAfterSeconds).toBe(600);
	});

	it('reads it also when the body is not the API envelope', () => {
		expect(parseApiError(429, null, '45').retryAfterSeconds).toBe(45);
	});

	it.each([
		null,
		'',
		'Wed, 21 Oct 2026 07:28:00 GMT',
		'-5',
		'1.5',
		'abc',
		'99999999999999999999',
	])('ignores %j', (header) => {
		expect(parseApiError(429, envelope, header).retryAfterSeconds).toBe(
			undefined,
		);
	});
});
