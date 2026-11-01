import { useQuery } from '@tanstack/react-query';
import { authQueries } from '../../api/auth.queries';
import { StationIdleLogout } from '../station-idle-logout/station-idle-logout';
import { useSessionEndingState } from '../use-session-ending-state';
import { useSignOut } from '../use-sign-out';
import { useStationMode } from '../use-station-mode';

/**
 * Logs out an idle station on every page (also `/login` and unknown paths) while a user of any role is signed in.
 * On a station it loads `me` itself, except while a sign-out waits for the server; elsewhere it sends no request.
 */
export function SessionIdleLogout() {
	const { isStationMode } = useStationMode();

	return isStationMode ? <StationSession /> : null;
}

function StationSession() {
	const sessionEndingState = useSessionEndingState();
	const { data: user } = useQuery({
		...authQueries.me(),
		enabled: sessionEndingState.status !== 'awaitingServerLogout',
	});
	const { signOutIdleStation } = useSignOut();

	return user ? <StationIdleLogout onTimeout={signOutIdleStation} /> : null;
}
