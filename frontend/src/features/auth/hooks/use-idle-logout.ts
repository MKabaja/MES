import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { config } from '@/shared/config/app.config';
import {
	MILLISECONDS_PER_MINUTE,
	MILLISECONDS_PER_SECOND,
} from '@/shared/lib/time.constants';

const WARNING_MILLISECONDS =
	config.station.idleWarningSeconds * MILLISECONDS_PER_SECOND;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

export type IdleLogoutState =
	| { status: 'active' }
	| { status: 'warning'; secondsLeft: number };

export type UseIdleLogoutOptions = {
	enabled: boolean;
	idleMinutes: number;
	onTimeout: () => void;
};

export type IdleLogoutControls = {
	state: IdleLogoutState;
	stayLoggedIn: () => void;
};

const ACTIVE_STATE: IdleLogoutState = { status: 'active' };

/**
 * Tracks inactivity (`pointerdown`, `keydown`, `touchstart`) and calls `onTimeout` once after `idleMinutes` without it; `stayLoggedIn` starts a new idle period.
 * Switches to `warning` for the last 30 s; from then only `stayLoggedIn` extends the session, other activity is ignored.
 * The deadline is a timestamp, so a throttled background tab still times out as soon as it wakes up. Does nothing while `enabled` is false.
 */
export function useIdleLogout({
	enabled,
	idleMinutes,
	onTimeout,
}: UseIdleLogoutOptions): IdleLogoutControls {
	const [state, setState] = useState<IdleLogoutState>(ACTIVE_STATE);
	const deadlineMillisecondsRef = useRef(0);
	const hasTimedOutRef = useRef(false);
	const idleMilliseconds = idleMinutes * MILLISECONDS_PER_MINUTE;
	const handleTimeout = useEffectEvent(onTimeout);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		function evaluateDeadline(): void {
			if (hasTimedOutRef.current) {
				return;
			}
			const remainingMilliseconds =
				deadlineMillisecondsRef.current - Date.now();
			if (remainingMilliseconds <= 0) {
				hasTimedOutRef.current = true;
				setState({ status: 'warning', secondsLeft: 0 });
				handleTimeout();
				return;
			}
			setState(
				remainingMilliseconds <= WARNING_MILLISECONDS
					? {
							status: 'warning',
							secondsLeft: Math.ceil(
								remainingMilliseconds / MILLISECONDS_PER_SECOND,
							),
						}
					: ACTIVE_STATE,
			);
		}

		function handleActivity(): void {
			const remainingMilliseconds =
				deadlineMillisecondsRef.current - Date.now();
			if (
				hasTimedOutRef.current ||
				remainingMilliseconds <= WARNING_MILLISECONDS
			) {
				return;
			}
			deadlineMillisecondsRef.current = Date.now() + idleMilliseconds;
		}

		deadlineMillisecondsRef.current = Date.now() + idleMilliseconds;
		hasTimedOutRef.current = false;
		evaluateDeadline();

		const intervalId = window.setInterval(
			evaluateDeadline,
			MILLISECONDS_PER_SECOND,
		);
		for (const eventName of ACTIVITY_EVENTS) {
			window.addEventListener(eventName, handleActivity, { passive: true });
		}
		document.addEventListener('visibilitychange', evaluateDeadline);

		return () => {
			window.clearInterval(intervalId);
			for (const eventName of ACTIVITY_EVENTS) {
				window.removeEventListener(eventName, handleActivity);
			}
			document.removeEventListener('visibilitychange', evaluateDeadline);
		};
	}, [enabled, idleMilliseconds]);

	function stayLoggedIn(): void {
		deadlineMillisecondsRef.current = Date.now() + idleMilliseconds;
		hasTimedOutRef.current = false;
		setState(ACTIVE_STATE);
	}

	return { state: enabled ? state : ACTIVE_STATE, stayLoggedIn };
}
