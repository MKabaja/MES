import { describe, expect, it } from 'vitest';
import { HttpError } from '@/shared/api/http-error';
import { createQueryClient, shouldRetryQuery } from './query-client';

function httpError(status: number, code: string): HttpError {
	return new HttpError({ status, code, message: 'error' });
}

describe('shouldRetryQuery', () => {
	it('retries once after a network error', () => {
		expect(shouldRetryQuery(0, httpError(0, 'NETWORK_ERROR'))).toBe(true);
	});

	it.each([500, 503])('retries once after a %i response', (status) => {
		expect(shouldRetryQuery(0, httpError(status, 'SERVER_ERROR'))).toBe(true);
	});

	it('does not retry a 4xx response', () => {
		expect(shouldRetryQuery(0, httpError(404, 'NOT_FOUND'))).toBe(false);
	});

	it('does not retry a second time', () => {
		expect(shouldRetryQuery(1, httpError(0, 'NETWORK_ERROR'))).toBe(false);
	});

	it('does not retry an error that is not an HttpError', () => {
		expect(shouldRetryQuery(0, new Error('boom'))).toBe(false);
	});
});

describe('createQueryClient', () => {
	it('sets the default staleTime and disables mutation retries', () => {
		const defaults = createQueryClient().getDefaultOptions();

		expect(defaults.queries?.staleTime).toBe(30_000);
		expect(defaults.queries?.retry).toBe(shouldRetryQuery);
		expect(defaults.mutations?.retry).toBe(0);
	});
});
