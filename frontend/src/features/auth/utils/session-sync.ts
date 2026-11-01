import type { QueryClient } from '@tanstack/react-query';
import { authQueries } from '../api/auth.queries';
import { sessionBroadcastMessageSchema } from '../model/auth.schemas';
import type { SessionBroadcastMessage, User } from '../model/auth.types';
import type { SessionEnding } from './session-ending';

export type SessionSyncDependencies = {
	queryClient: QueryClient;
	sessionEnding: SessionEnding;
};

type SessionSync = {
	announce: (message: SessionBroadcastMessage) => void;
	dispose: () => void;
};

const SESSION_CHANNEL_NAME = 'mes-session';

let currentSessionSync: SessionSync | null = null;

/**
 * Keeps the session of this tab in line with other tabs and makes it current, disposing the previous one; call once at startup.
 *
 * - Another tab announcing `ended`, or `signedIn` for a different user, drops this tab's session data and moves it to `/login` without a logout request.
 * - When the tab becomes visible again, `me` is fetched anew; no session or a different user drops the session the same way.
 * Without `BroadcastChannel` support only the visibility check runs.
 */
export function startSessionSync(dependencies: SessionSyncDependencies): void {
	currentSessionSync?.dispose();
	currentSessionSync = createSessionSync(dependencies);
}

/**
 * Tells other tabs that the server confirmed the end of the session.
 */
export function announceSessionEnded(): void {
	currentSessionSync?.announce({ type: 'ended' });
}

/**
 * Tells other tabs that this tab signed in as the given user.
 */
export function announceSignedIn(userId: User['id']): void {
	currentSessionSync?.announce({ type: 'signedIn', userId });
}

function createSessionSync({
	queryClient,
	sessionEnding,
}: SessionSyncDependencies): SessionSync {
	const channel = openSessionChannel();

	channel?.addEventListener('message', handleMessage);
	document.addEventListener('visibilitychange', handleVisibilityChange);

	function handleMessage(event: MessageEvent): void {
		const message = sessionBroadcastMessageSchema.safeParse(event.data);
		if (!message.success) {
			return;
		}
		const currentUserId = getCachedUser()?.id;
		if (currentUserId === undefined) {
			return;
		}
		if (
			message.data.type === 'ended' ||
			message.data.userId !== currentUserId
		) {
			void sessionEnding.dropSession();
		}
	}

	function handleVisibilityChange(): void {
		if (document.visibilityState !== 'visible') {
			return;
		}
		void verifySession();
	}

	async function verifySession(): Promise<void> {
		const cachedUser = getCachedUser();
		if (!cachedUser || sessionEnding.getState().status !== 'active') {
			return;
		}
		let freshUser: User | null;
		try {
			freshUser = await queryClient.fetchQuery({
				...authQueries.me(),
				staleTime: 0,
			});
		} catch {
			return;
		}
		if (freshUser?.id !== cachedUser.id) {
			await sessionEnding.dropSession();
		}
	}

	function getCachedUser(): User | null | undefined {
		return queryClient.getQueryData(authQueries.me().queryKey);
	}

	function announce(message: SessionBroadcastMessage): void {
		channel?.postMessage(message);
	}

	function dispose(): void {
		channel?.removeEventListener('message', handleMessage);
		channel?.close();
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	}

	return { announce, dispose };
}

function openSessionChannel(): BroadcastChannel | null {
	if (typeof BroadcastChannel === 'undefined') {
		return null;
	}
	return new BroadcastChannel(SESSION_CHANNEL_NAME);
}
