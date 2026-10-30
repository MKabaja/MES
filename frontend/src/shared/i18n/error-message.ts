import type { HttpError } from '@/shared/api/http-error';
import { i18n } from './i18n';
import { resourcesByLanguage } from './i18n.constants';
import type { I18nResources } from './i18n.types';

type TranslatedErrorCode = keyof I18nResources['errors'];

function hasTranslation(code: string): code is TranslatedErrorCode {
	return Object.hasOwn(resourcesByLanguage.pl.errors, code);
}

/**
 * Returns the error text in the current UI language, chosen by `error.code`.
 *
 * Falls back to the API `message` when the code has no translation.
 */
export function getErrorMessage(error: HttpError): string {
	if (!hasTranslation(error.code)) {
		return error.message;
	}
	return i18n.t(error.code, { ns: 'errors' });
}
