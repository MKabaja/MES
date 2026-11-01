import { useEffect, useState } from 'react';

/**
 * Returns the current instant as a UTC ISO string, refreshed every `refreshIntervalMilliseconds`.
 */
export function useCurrentTime(refreshIntervalMilliseconds: number): string {
	const [nowIso, setNowIso] = useState(() => new Date().toISOString());

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setNowIso(new Date().toISOString());
		}, refreshIntervalMilliseconds);

		return () => window.clearInterval(intervalId);
	}, [refreshIntervalMilliseconds]);

	return nowIso;
}
