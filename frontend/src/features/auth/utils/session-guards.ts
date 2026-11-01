import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { isSessionRejectedError } from '@/shared/api/http-error';
import { getErrorMessage } from '@/shared/i18n/error-message';
import { authQueries } from '../api/auth.queries';
import { isServerLogoutPending } from '../api/session-ending';
import type { User } from '../model/auth.types';

/**
 * Resolves the signed-in user from the `me` query, or `null` for a guest.
 *
 * @throws a router redirect to `/login` carrying the server message when the session is rejected (`ACCOUNT_INACTIVE`, `NETWORK_NOT_ALLOWED`),
 * and a plain redirect to `/login` without checking the session while a sign-out waits for the server.
 */
export async function loadSessionUser(
	queryClient: QueryClient,
): Promise<User | null> {
	if (isServerLogoutPending()) {
		throw redirect({ to: '/login', replace: true });
	}
	try {
		const user = await queryClient.ensureQueryData(authQueries.me());
		if (!user) {
			removeDataOutsideSession(queryClient);
		}
		return user;
	} catch (error) {
		if (isSessionRejectedError(error)) {
			throw redirect({
				to: '/login',
				replace: true,
				state: { sessionEndedMessage: getErrorMessage(error) },
			});
		}
		throw error;
	}
}

function removeDataOutsideSession(queryClient: QueryClient): void {
	queryClient.removeQueries({
		predicate: (query) => query.queryKey[0] !== authQueries.all()[0],
	});
}

/**
 * Returns the signed-in user for a protected route.
 *
 * @param redirectPath - relative path (with search) the login screen returns to after sign-in.
 * @throws a router redirect to `/login?redirect=<redirectPath>` for a guest.
 */
export async function requireUser(
	queryClient: QueryClient,
	redirectPath: string,
): Promise<User> {
	const user = await loadSessionUser(queryClient);
	if (!user) {
		throw redirect({
			to: '/login',
			search: { redirect: redirectPath },
			replace: true,
		});
	}
	return user;
}
