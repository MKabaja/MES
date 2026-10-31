import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
	setUiLanguageReader,
	type UiLanguage,
	uiLanguageSchema,
} from '@/shared/config/app.config';
import { readStorage, writeStorage } from '@/shared/lib/storage';
import { DEFAULT_LANGUAGE, resourcesByLanguage } from './i18n.constants';

/**
 * Application i18n instance; starts in the language saved in storage (`pl` when missing or invalid).
 */
export const i18n = createInstance();

void i18n.use(initReactI18next).init({
	lng: readStorage('mes.uiLanguage'),
	fallbackLng: DEFAULT_LANGUAGE,
	supportedLngs: uiLanguageSchema.options,
	defaultNS: 'common',
	ns: ['common', 'errors'],
	resources: resourcesByLanguage,
	initAsync: false,
	interpolation: { escapeValue: false },
});

function readCurrentLanguage(): UiLanguage {
	const parsed = uiLanguageSchema.safeParse(i18n.resolvedLanguage);
	return parsed.success ? parsed.data : DEFAULT_LANGUAGE;
}

function applyLanguageToDocument(): void {
	document.documentElement.lang = readCurrentLanguage();
}

setUiLanguageReader(readCurrentLanguage);
applyLanguageToDocument();
i18n.on('languageChanged', applyLanguageToDocument);

/**
 * Switches the UI language and saves the choice; `Accept-Language`, number formatting and `<html lang>` follow.
 */
export async function changeUiLanguage(language: UiLanguage): Promise<void> {
	await i18n.changeLanguage(language);
	writeStorage('mes.uiLanguage', language);
}
