import { resetCsrfCookie } from '@/shared/api/csrf';
import { ensureCsrfCookie } from '@/shared/api/http';
import {
	HttpError,
	INVALID_RESPONSE_CODE,
	NETWORK_ERROR_CODE,
} from '@/shared/api/http-error';
import { HTTP_STATUS } from '@/shared/api/http-status.constants';
import { logout } from './auth.api';

export type ServerLogoutOutcome =
	| { status: 'signedOut' }
	| { status: 'failed'; error: HttpError };

/**
 * Calls `POST /auth/logout` and reports whether the server session is gone; never throws.
 *
 * A `204` or a `401` (no session left) count as `signedOut`; a network failure and any other error as `failed`.
 */
export async function requestServerLogout(): Promise<ServerLogoutOutcome> {
	try {
		await logout();
		return { status: 'signedOut' };
	} catch (error) {
		const httpError = toHttpError(error);
		return httpError.status === HTTP_STATUS.unauthorized
			? { status: 'signedOut' }
			: { status: 'failed', error: httpError };
	}
}

/**
 * Tells whether a failed logout never reached the server.
 */
export function isNetworkFailure(error: HttpError): boolean {
	return error.code === NETWORK_ERROR_CODE;
}

/**
 * Fetches a fresh CSRF cookie after the session ended; never throws, a failure only forces a refetch on the next request.
 */
export async function refreshCsrfCookie(): Promise<void> {
	try {
		await ensureCsrfCookie(true);
	} catch {
		resetCsrfCookie();
	}
}

function toHttpError(error: unknown): HttpError {
	if (error instanceof HttpError) {
		return error;
	}
	return new HttpError({
		status: 0,
		code: INVALID_RESPONSE_CODE,
		message: error instanceof Error ? error.message : String(error),
	});
}
