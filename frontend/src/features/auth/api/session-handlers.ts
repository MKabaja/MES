import type { QueryClient } from '@tanstack/react-query';
import type { AnyRouter } from '@tanstack/react-router';
import {
	setSessionRejectedHandler,
	setUnauthorizedHandler,
} from '@/shared/api/http';
import type { HttpError } from '@/shared/api/http-error';
import { getErrorMessage } from '@/shared/i18n/error-message';
import { authQueries } from './auth.queries';
import { logoutIgnoringLostSession, refreshCsrfCookie } from './end-session';
import { LOGOUT_MUTATION_KEY } from './use-logout';

export type SessionHandlersDependencies = {
	queryClient: QueryClient;
	router: AnyRouter;
};

const LOGIN_PATH = '/login';

/**
 * Registers the global reactions to an unusable session; call once at startup.
 *
 * - `401` outside the `me` check and an explicit logout: clears the cache and moves to `/login?redirect=<current path>`.
 * - `403 ACCOUNT_INACTIVE` / `NETWORK_NOT_ALLOWED`: signs out on the server, clears the cache and moves to `/login` with the server message in history state.
 * Nothing happens on `/login`, while another teardown is running, or for the guest `me` check (the route guard redirects on its own).
 */
export function registerSessionHandlers({
	queryClient,
	router,
}: SessionHandlersDependencies): void {
	let isEndingSession = false;

	function isOnLoginPage(): boolean {
		return router.state.location.pathname === LOGIN_PATH;
	}

	function isSessionCheckOrLogoutRunning(): boolean {
		return (
			queryClient.isFetching({ queryKey: authQueries.me().queryKey }) > 0 ||
			queryClient.isMutating({ mutationKey: LOGOUT_MUTATION_KEY }) > 0
		);
	}

	async function endExpiredSession(): Promise<void> {
		const redirectPath = router.state.location.href;
		queryClient.clear();
		router.clearCache();
		await router.navigate({
			to: LOGIN_PATH,
			search: { redirect: redirectPath },
			replace: true,
		});
	}

	async function endRejectedSession(error: HttpError): Promise<void> {
		try {
			await logoutIgnoringLostSession();
		} catch {
			// the session is unusable either way; keep going to the login screen
		}
		queryClient.clear();
		router.clearCache();
		await refreshCsrfCookie();
		if (!isOnLoginPage()) {
			await router.navigate({
				to: LOGIN_PATH,
				replace: true,
				state: { sessionEndedMessage: getErrorMessage(error) },
			});
		}
	}

	function runExclusively(teardown: () => Promise<void>): void {
		isEndingSession = true;
		void teardown().finally(() => {
			isEndingSession = false;
		});
	}

	setUnauthorizedHandler(() => {
		if (isEndingSession || isOnLoginPage() || isSessionCheckOrLogoutRunning()) {
			return;
		}
		runExclusively(endExpiredSession);
	});

	setSessionRejectedHandler((error) => {
		if (isEndingSession || isOnLoginPage()) {
			return;
		}
		runExclusively(() => endRejectedSession(error));
	});
}
