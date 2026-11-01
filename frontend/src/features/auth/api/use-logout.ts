import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import type { HttpError } from '@/shared/api/http-error';
import { logoutIgnoringLostSession, refreshCsrfCookie } from './end-session';

export type UseLogoutResult = UseMutationResult<void, HttpError, void>;

export const LOGOUT_MUTATION_KEY = ['auth', 'logout'] as const;

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
		mutationKey: LOGOUT_MUTATION_KEY,
		mutationFn: logoutIgnoringLostSession,
		onSuccess: async () => {
			queryClient.clear();
			await refreshCsrfCookie();
		},
	});
}
