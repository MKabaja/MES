import { z } from 'zod';

export const uiLanguageSchema = z.enum(['pl', 'en']);

export type UiLanguage = z.infer<typeof uiLanguageSchema>;

type FormatLocaleByLanguage = Record<UiLanguage, string>;

const formatLocaleByLanguage: FormatLocaleByLanguage = {
	pl: 'pl-PL',
	en: 'en-GB',
};

let readUiLanguage: () => UiLanguage = () => config.i18n.defaultLanguage;

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

/**
 * Application settings grouped by topic; the single place for tunable values.
 */
export const config = {
	api: {
		baseUrl: '/api/v1',
		csrfCookiePath: '/sanctum/csrf-cookie',
		xsrfCookieName: 'XSRF-TOKEN',
	},
	plant: {
		timezone: 'Europe/Warsaw',
	},
	i18n: {
		defaultLanguage: 'pl' satisfies UiLanguage,
	},
	queries: {
		staleTimeMilliseconds: 30_000,
		sessionStaleTimeMilliseconds: Number.POSITIVE_INFINITY,
		maxQueryRetries: 1,
		mutationRetries: 0,
	},
	layout: {
		desktopMediaQuery: '(min-width: 1024px)',
		terminalClockRefreshMilliseconds: 15_000,
	},
	station: {
		idleLogoutFallbackMinutes: 5,
		idleWarningSeconds: 30,
		signOutRetrySeconds: 30,
	},
} as const;
