export const API_BASE = '/api/v1';

export const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';

export type UiLanguage = 'pl' | 'en';

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
