import {
	type HttpError,
	INVALID_RESPONSE_CODE,
	NETWORK_ERROR_CODE,
} from '@/shared/api/http-error';
import { i18n } from './i18n';

/**
 * Returns the text to show for an error.
 *
 * Client-side codes (`NETWORK_ERROR`, `INVALID_RESPONSE`) are translated to the UI language;
 * every other message comes from the API unchanged, since the server localizes it.
 */
export function getErrorMessage(error: HttpError): string {
	if (error.code === NETWORK_ERROR_CODE) {
		return i18n.t('NETWORK_ERROR', { ns: 'errors' });
	}
	if (error.code === INVALID_RESPONSE_CODE) {
		return i18n.t('INVALID_RESPONSE', { ns: 'errors' });
	}
	return error.message;
}
