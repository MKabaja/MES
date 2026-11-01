import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import { resetCsrfCookie } from '@/shared/api/csrf';
import { ensureCsrfCookie } from '@/shared/api/http';
import { HttpError, NETWORK_ERROR_CODE } from '@/shared/api/http-error';
import { logout } from './auth.api';

export type UseLogoutResult = UseMutationResult<void, HttpError, void>;

const STATUS_UNAUTHORIZED = 401;

function isAlreadySignedOut(error: unknown): boolean {
	return (
		error instanceof HttpError &&
		(error.status === STATUS_UNAUTHORIZED || error.code === NETWORK_ERROR_CODE)
	);
}

async function logoutIgnoringLostSession(): Promise<void> {
	try {
		await logout();
	} catch (error) {
		if (!isAlreadySignedOut(error)) {
			throw error;
		}
	}
}

async function refreshCsrfCookie(): Promise<void> {
	try {
		await ensureCsrfCookie(true);
	} catch {
		resetCsrfCookie();
	}
}

/**
 * Mutation that signs out, clears the whole query cache and fetches a fresh CSRF cookie.
 *
 * A `401` or a network failure counts as success (the session is gone either way), so the caller
 * can always move on to the login screen; other errors leave the cache untouched.
 * Navigation belongs to the caller (`mutate(undefined, { onSuccess })`).
 */
export function useLogout(): UseLogoutResult {
	const queryClient = useQueryClient();
	return useMutation<void, HttpError, void>({
		mutationFn: logoutIgnoringLostSession,
		onSuccess: async () => {
			queryClient.clear();
			await refreshCsrfCookie();
		},
	});
}
