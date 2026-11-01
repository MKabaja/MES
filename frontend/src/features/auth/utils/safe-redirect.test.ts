import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './safe-redirect';

describe('getSafeRedirectPath', () => {
	it.each([
		'/zlecenia',
		'/zlecenia/12?tab=historia',
		'/s/ZP-2026-001#top',
		'/',
	])('keeps the relative path %j', (path) => {
		expect(getSafeRedirectPath(path)).toBe(path);
	});

	it.each([
		['missing', undefined],
		['empty', ''],
		['absolute URL', 'https://evil.example'],
		['protocol-relative URL', '//evil.example'],
		['slash and backslash', '/\\evil.example'],
		['backslash deeper in the path', '/zlecenia\\..\\evil'],
		['javascript scheme', 'javascript:alert(1)'],
		['relative without slash', 'zlecenia'],
		['leading space', ' /zlecenia'],
		['leading newline', '\n/zlecenia'],
		['tab hiding a second slash', '/\t/evil.example'],
		['newline hiding a second slash', '/\n/evil.example'],
		['null byte', '/zle\u0000cenia'],
	])('falls back to / for %s', (_label, value) => {
		expect(getSafeRedirectPath(value)).toBe('/');
	});
});
