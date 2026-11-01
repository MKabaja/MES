import { resetCsrfCookie } from '@/shared/api/csrf';
import { ensureCsrfCookie } from '@/shared/api/http';
import { HttpError, NETWORK_ERROR_CODE } from '@/shared/api/http-error';
import { logout } from './auth.api';

const STATUS_UNAUTHORIZED = 401;

function isAlreadySignedOut(error: unknown): boolean {
	return (
		error instanceof HttpError &&
		(error.status === STATUS_UNAUTHORIZED || error.code === NETWORK_ERROR_CODE)
	);
}

/**
 * Calls `POST /auth/logout`, treating `401` and a network failure as success because the session is gone either way.
 *
 * @throws {@link HttpError} for any other failure.
 */
export async function logoutIgnoringLostSession(): Promise<void> {
	try {
		await logout();
	} catch (error) {
		if (!isAlreadySignedOut(error)) {
			throw error;
		}
	}
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
