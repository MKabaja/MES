import { describe, expect, it } from 'vitest';
import {
	getFormatLocale,
	getUiLanguage,
	setUiLanguageReader,
} from './app.config';

describe('getUiLanguage', () => {
	it('returns the language from the registered reader', () => {
		setUiLanguageReader(() => 'en');

		expect(getUiLanguage()).toBe('en');
	});
});

describe('getFormatLocale', () => {
	it.each([
		['pl', 'pl-PL'],
		['en', 'en-GB'],
	] as const)('maps %s to %s', (language, locale) => {
		setUiLanguageReader(() => language);

		expect(getFormatLocale()).toBe(locale);
	});
});
