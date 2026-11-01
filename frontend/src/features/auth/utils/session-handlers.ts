import type { QueryClient } from '@tanstack/react-query';
import type { AnyRouter } from '@tanstack/react-router';
import {
	setSessionRejectedHandler,
	setUnauthorizedHandler,
} from '@/shared/api/http';
import { getErrorMessage } from '@/shared/i18n/error-message';
import { authQueries } from '../api/auth.queries';
import { LOGIN_PATH } from '../model/auth.constants';
import { startSessionEnding } from './session-ending';

export type SessionHandlersDependencies = {
	queryClient: QueryClient;
	router: AnyRouter;
};

/**
 * Registers the global reactions to an unusable session; call once at startup.
 *
 * - `401` outside the `me` check and a running sign-out: clears the cache and moves to `/login?redirect=<current path>`.
 * - `403 ACCOUNT_INACTIVE` / `NETWORK_NOT_ALLOWED`: hides all data at once, signs out on the server and moves to `/login` with the server message in history state.
 * Nothing happens on `/login`, for the guest `me` check (the route guard redirects on its own), or while and after a session ends, until `me` holds a signed-in user again.
 */
export function registerSessionHandlers({
	queryClient,
	router,
}: SessionHandlersDependencies): void {
	const sessionEnding = startSessionEnding({ queryClient, router });

	function isOnLoginPage(): boolean {
		return router.state.location.pathname === LOGIN_PATH;
	}

	function isSessionCheckRunning(): boolean {
		return queryClient.isFetching({ queryKey: authQueries.me().queryKey }) > 0;
	}

	setUnauthorizedHandler(() => {
		if (isOnLoginPage() || isSessionCheckRunning()) {
			return;
		}
		void sessionEnding.expireSession();
	});

	setSessionRejectedHandler((error) => {
		if (isOnLoginPage()) {
			return;
		}
		sessionEnding.forceSignOut(getErrorMessage(error));
	});
}
