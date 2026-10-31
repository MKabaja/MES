import { describe, expect, it } from 'vitest';
import { mockCookies } from '@/test/cookies';
import { readXsrfToken } from './csrf';

describe('readXsrfToken', () => {
	it('returns null without the cookie', () => {
		mockCookies('other=1');

		expect(readXsrfToken()).toBeNull();
	});

	it('decodes the cookie value among other cookies', () => {
		mockCookies('other=1; XSRF-TOKEN=a%2Fb%3D');

		expect(readXsrfToken()).toBe('a/b=');
	});

	it('returns null for a malformed percent-encoded value', () => {
		mockCookies('XSRF-TOKEN=%E0%A4%A');

		expect(readXsrfToken()).toBeNull();
	});
});
