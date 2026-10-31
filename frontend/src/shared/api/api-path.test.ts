import { describe, expect, it } from 'vitest';
import { apiPath, assertNoPathTraversal } from './api-path';

describe('apiPath', () => {
	it('encodes every interpolated parameter', () => {
		const code = 'ZP/1 2?x=1';

		expect(apiPath`/scan/${code}`).toBe('/scan/ZP%2F1%202%3Fx%3D1');
	});

	it('keeps numbers and multiple parameters in order', () => {
		expect(apiPath`/orders/${12}/positions/${'a b'}`).toBe(
			'/orders/12/positions/a%20b',
		);
	});

	it('returns a path without parameters unchanged', () => {
		expect(apiPath`/orders`).toBe('/orders');
	});

	it('produces a path that assertNoPathTraversal rejects for a ".." parameter', () => {
		const code = '..';

		expect(() => assertNoPathTraversal(apiPath`/scan/${code}`)).toThrow(
			RangeError,
		);
	});

	it('neutralises "../" inside a parameter by encoding the slash', () => {
		const code = '../admin';

		expect(apiPath`/scan/${code}`).toBe('/scan/..%2Fadmin');
	});
});

describe('assertNoPathTraversal', () => {
	it('accepts a regular path with a query string', () => {
		expect(() => assertNoPathTraversal('/orders?search=a..b')).not.toThrow();
	});

	it('ignores ".." in the query string', () => {
		expect(() => assertNoPathTraversal('/orders?next=../x')).not.toThrow();
	});

	it('accepts a path with a malformed percent sequence', () => {
		expect(() => assertNoPathTraversal('/orders/%E0')).not.toThrow();
	});
});
