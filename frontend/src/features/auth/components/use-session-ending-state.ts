import { useSyncExternalStore } from 'react';
import {
	getSessionEnding,
	type SessionEndingState,
} from '../utils/session-ending';

/**
 * Returns the current phase of ending the session and re-renders when it changes.
 */
export function useSessionEndingState(): SessionEndingState {
	const sessionEnding = getSessionEnding();
	return useSyncExternalStore(sessionEnding.subscribe, sessionEnding.getState);
}
