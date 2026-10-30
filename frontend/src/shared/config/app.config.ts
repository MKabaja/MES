import { z } from 'zod';

export const API_BASE = '/api/v1';

export const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';

export const PLANT_TIMEZONE = 'Europe/Warsaw';

export const uiLanguageSchema = z.enum(['pl', 'en']);

export type UiLanguage = z.infer<typeof uiLanguageSchema>;

type FormatLocaleByLanguage = Record<UiLanguage, string>;

const formatLocaleByLanguage: FormatLocaleByLanguage = {
	pl: 'pl-PL',
	en: 'en-GB',
};

const DEFAULT_UI_LANGUAGE: UiLanguage = 'pl';

let readUiLanguage: () => UiLanguage = () => DEFAULT_UI_LANGUAGE;

/**
 * Returns the current UI language sent to the API as `Accept-Language`.
 */
export function getUiLanguage(): UiLanguage {
	return readUiLanguage();
}

/**
 * Replaces the source of the UI language; call once at startup when i18n is initialised.
 */
export function setUiLanguageReader(reader: () => UiLanguage): void {
	readUiLanguage = reader;
}

/**
 * Returns the BCP 47 locale used for number formatting in the current UI language.
 */
export function getFormatLocale(): string {
	return formatLocaleByLanguage[getUiLanguage()];
}
