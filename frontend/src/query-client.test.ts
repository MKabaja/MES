import { describe, expect, it } from 'vitest';
import { createQueryClient, shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
	it('retries once after a network error', () => {
		expect(shouldRetryQuery(0, { status: 0, code: 'NETWORK_ERROR' })).toBe(
			true,
		);
	});

	it('retries once after a 5xx response', () => {
		expect(shouldRetryQuery(0, { status: 503, code: 'SERVER_ERROR' })).toBe(
			true,
		);
	});

	it('does not retry a 4xx response', () => {
		expect(shouldRetryQuery(0, { status: 404, code: 'NOT_FOUND' })).toBe(false);
	});

	it('does not retry a second time', () => {
		expect(shouldRetryQuery(1, { status: 0, code: 'NETWORK_ERROR' })).toBe(
			false,
		);
	});

	it('does not retry an error without status and code', () => {
		expect(shouldRetryQuery(0, new Error('boom'))).toBe(false);
	});
});

describe('createQueryClient', () => {
	it('sets the default staleTime and disables mutation retries', () => {
		const defaults = createQueryClient().getDefaultOptions();

		expect(defaults.queries?.staleTime).toBe(30_000);
		expect(defaults.mutations?.retry).toBe(0);
	});
});
