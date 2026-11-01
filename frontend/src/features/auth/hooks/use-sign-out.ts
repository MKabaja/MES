import { toast } from 'sonner';
import { HttpError } from '@/shared/api/http-error';
import { getErrorMessage } from '@/shared/i18n/error-message';
import { getSessionEnding } from '../api/session-ending';
import { useSessionEndingState } from './use-session-ending-state';

export type SignOutControls = {
	signOut: () => void;
	signOutIdleStation: () => void;
	isSigningOut: boolean;
};

/**
 * Signs the user out and replaces the current page with `/login` (without `redirect`, so the next person at a shared device does not land on this page).
 *
 * - `signOut`: a failure other than a lost connection shows the server message as a toast and keeps the user on the page.
 * - `signOutIdleStation`: hides the data at once and keeps retrying until the server confirms the logout.
 */
export function useSignOut(): SignOutControls {
	const sessionEnding = getSessionEnding();
	const sessionEndingState = useSessionEndingState();

	function signOut(): void {
		sessionEnding.signOut().catch(showSignOutError);
	}

	function signOutIdleStation(): void {
		sessionEnding.forceSignOut();
	}

	return {
		signOut,
		signOutIdleStation,
		isSigningOut:
			sessionEndingState.status === 'signingOut' ||
			sessionEndingState.status === 'leaving',
	};
}

function showSignOutError(error: unknown): void {
	if (error instanceof HttpError) {
		toast.error(getErrorMessage(error));
	}
}
