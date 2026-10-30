import { describe, expect, it } from 'vitest';
import { getUiLanguage, setUiLanguageReader } from './app.config';

describe('getUiLanguage', () => {
	it('defaults to pl before a reader is set', () => {
		expect(getUiLanguage()).toBe('pl');
	});

	it('returns the language from the registered reader', () => {
		setUiLanguageReader(() => 'en');

		expect(getUiLanguage()).toBe('en');
	});
});
