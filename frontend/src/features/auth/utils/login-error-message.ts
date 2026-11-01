import type { TFunction } from 'i18next';
import type { HttpError } from '@/shared/api/http-error';
import { HTTP_STATUS } from '@/shared/api/http-status.constants';
import { getErrorMessage } from '@/shared/i18n/error-message';
import { SECONDS_PER_MINUTE } from '@/shared/lib/time.constants';

/**
 * Returns the single message shown under the login button for a failed sign-in.
 *
 * A `429` reports the wait from `Retry-After` in whole minutes (rounded up); every other message comes from the server unchanged.
 */
export function getLoginErrorMessage(error: HttpError, t: TFunction): string {
	if (error.status !== HTTP_STATUS.tooManyRequests) {
		return getErrorMessage(error);
	}
	const minutes = getRetryAfterMinutes(error.retryAfterSeconds);
	return minutes > 1
		? t('auth.login.tooManyAttemptsMinutes', { minutes })
		: t('auth.login.tooManyAttemptsMinute');
}

function getRetryAfterMinutes(retryAfterSeconds: number | undefined): number {
	if (retryAfterSeconds === undefined) {
		return 1;
	}
	return Math.ceil(retryAfterSeconds / SECONDS_PER_MINUTE);
}
