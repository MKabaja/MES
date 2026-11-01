import type { QueryClient } from '@tanstack/react-query';
import type { AnyRouter } from '@tanstack/react-router';
import type { HttpError } from '@/shared/api/http-error';
import { config } from '@/shared/config/app.config';
import { MILLISECONDS_PER_SECOND } from '@/shared/lib/time.constants';
import { authQueries } from './auth.queries';
import {
	isNetworkFailure,
	refreshCsrfCookie,
	requestServerLogout,
} from './end-session';

export type SessionEndingState =
	| { status: 'active' }
	| { status: 'signingOut' }
	| { status: 'awaitingServerLogout'; isOffline: boolean }
	| { status: 'leaving' }
	| { status: 'ended' };

export type SessionEndingDependencies = {
	queryClient: QueryClient;
	router: AnyRouter;
};

export type SessionEnding = {
	getState: () => SessionEndingState;
	subscribe: (listener: () => void) => () => void;
	signOut: () => Promise<void>;
	forceSignOut: (sessionEndedMessage?: string) => void;
	expireSession: () => Promise<void>;
	dispose: () => void;
};

const LOGIN_PATH = '/login';
const LOGOUT_RETRY_MILLISECONDS =
	config.session.logoutRetrySeconds * MILLISECONDS_PER_SECOND;
const ACTIVE_STATE: SessionEndingState = { status: 'active' };
const ENDED_STATE: SessionEndingState = { status: 'ended' };
const LEAVING_STATE: SessionEndingState = { status: 'leaving' };

let currentSessionEnding: SessionEnding | null = null;

/**
 * Creates the single owner of every way a session ends and makes it current, disposing the previous one; call once at startup.
 *
 * - `signOut`: one logout attempt with the page still visible; rejects with `HttpError` on a failure other than a lost connection.
 * - `forceSignOut` (idle station, rejected session) and a lost connection: clears all cached data, shows the `awaitingServerLogout` curtain and retries
 *   the logout every `config.session.logoutRetrySeconds` and on `online`, one request at a time, until the server answers `204` or `401`.
 * - `expireSession` (`401`): clears the cache and moves to `/login?redirect=<current path>`. Late calls are ignored until `me` holds a user again.
 */
export function startSessionEnding(
	dependencies: SessionEndingDependencies,
): SessionEnding {
	currentSessionEnding?.dispose();
	currentSessionEnding = createSessionEnding(dependencies);
	return currentSessionEnding;
}

/**
 * Returns the session ending started at startup.
 *
 * @throws {@link Error} when {@link startSessionEnding} was not called yet.
 */
export function getSessionEnding(): SessionEnding {
	if (!currentSessionEnding) {
		throw new Error(
			'Session ending is not started; register session handlers at startup.',
		);
	}
	return currentSessionEnding;
}

/**
 * Tells whether a sign-out is waiting for the server, so no session data may be loaded or shown.
 */
export function isServerLogoutPending(): boolean {
	return currentSessionEnding?.getState().status === 'awaitingServerLogout';
}

function createSessionEnding({
	queryClient,
	router,
}: SessionEndingDependencies): SessionEnding {
	let state = ACTIVE_STATE;
	let sessionEndedMessage: string | undefined;
	let isRequestRunning = false;
	let isRetryRequested = false;
	let retryTimeoutId: number | undefined;
	let isDisposed = false;
	const listeners = new Set<() => void>();

	const unsubscribeFromQueries = queryClient.getQueryCache().subscribe(() => {
		if (state.status === 'ended' && hasSignedInUser()) {
			setState(ACTIVE_STATE);
		}
	});

	async function signOut(): Promise<void> {
		if (state.status !== 'active') {
			return;
		}
		setState({ status: 'signingOut' });
		const error = await attemptLogout();
		if (error) {
			throw error;
		}
	}

	function forceSignOut(message?: string): void {
		if (state.status !== 'active' && state.status !== 'signingOut') {
			return;
		}
		sessionEndedMessage = message;
		showCurtain(false);
		if (!isRequestRunning) {
			void attemptLogout();
		}
	}

	async function expireSession(): Promise<void> {
		if (state.status !== 'active') {
			return;
		}
		setState(LEAVING_STATE);
		const redirectPath = router.state.location.href;
		queryClient.clear();
		router.clearCache();
		try {
			await router.navigate({
				to: LOGIN_PATH,
				search: { redirect: redirectPath },
				replace: true,
			});
		} finally {
			finishEnding();
		}
	}

	async function attemptLogout(): Promise<HttpError | null> {
		if (isRequestRunning) {
			isRetryRequested = true;
			return null;
		}
		cancelScheduledRetry();
		isRequestRunning = true;
		const outcome = await requestServerLogout();
		isRequestRunning = false;
		if (isDisposed) {
			return null;
		}
		if (outcome.status === 'signedOut') {
			await leaveSession();
			return null;
		}
		return handleLogoutFailure(outcome.error);
	}

	function handleLogoutFailure(error: HttpError): HttpError | null {
		const isOffline = isNetworkFailure(error);
		if (state.status === 'signingOut' && !isOffline) {
			setState(ACTIVE_STATE);
			return error;
		}
		showCurtain(isOffline);
		if (isRetryRequested) {
			isRetryRequested = false;
			void attemptLogout();
		} else {
			retryTimeoutId = window.setTimeout(
				handleRetryDue,
				LOGOUT_RETRY_MILLISECONDS,
			);
		}
		return null;
	}

	function showCurtain(isOffline: boolean): void {
		if (state.status !== 'awaitingServerLogout') {
			queryClient.clear();
			router.clearCache();
			window.addEventListener('online', handleRetryDue);
		}
		setState({ status: 'awaitingServerLogout', isOffline });
	}

	async function leaveSession(): Promise<void> {
		stopRetrying();
		if (state.status !== 'awaitingServerLogout') {
			setState(LEAVING_STATE);
		}
		queryClient.clear();
		await refreshCsrfCookie();
		router.clearCache();
		try {
			await router.navigate({
				to: LOGIN_PATH,
				replace: true,
				...(sessionEndedMessage === undefined
					? {}
					: { state: { sessionEndedMessage } }),
			});
		} finally {
			sessionEndedMessage = undefined;
			finishEnding();
		}
	}

	function finishEnding(): void {
		setState(hasSignedInUser() ? ACTIVE_STATE : ENDED_STATE);
	}

	function handleRetryDue(): void {
		void attemptLogout();
	}

	function cancelScheduledRetry(): void {
		window.clearTimeout(retryTimeoutId);
		retryTimeoutId = undefined;
	}

	function stopRetrying(): void {
		cancelScheduledRetry();
		isRetryRequested = false;
		window.removeEventListener('online', handleRetryDue);
	}

	function hasSignedInUser(): boolean {
		return Boolean(queryClient.getQueryData(authQueries.me().queryKey));
	}

	function setState(nextState: SessionEndingState): void {
		state = nextState;
		for (const listener of listeners) {
			listener();
		}
	}

	function subscribe(listener: () => void): () => void {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	function dispose(): void {
		isDisposed = true;
		stopRetrying();
		unsubscribeFromQueries();
		listeners.clear();
	}

	return {
		getState: () => state,
		subscribe,
		signOut,
		forceSignOut,
		expireSession,
		dispose,
	};
}
