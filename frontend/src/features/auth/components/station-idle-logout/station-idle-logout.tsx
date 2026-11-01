import { useQuery } from '@tanstack/react-query';
import { settingsQueries } from '@/features/settings/api/settings.queries';
import { config } from '@/shared/config/app.config';
import { useIdleLogout } from '../../hooks/use-idle-logout';
import { IdleLogoutDialog } from '../idle-logout-dialog/idle-logout-dialog';
import { useStationMode } from '../station-mode-toggle/use-station-mode';

export type StationIdleLogoutProps = { onTimeout: () => void };

/**
 * Logs out an idle shared hall station through `onTimeout`, showing a countdown dialog first.
 * Does nothing on devices not marked as a station and uses the contract default idle time until the setting loads or when it cannot be loaded.
 */
export function StationIdleLogout({ onTimeout }: StationIdleLogoutProps) {
	const { isStationMode } = useStationMode();

	return isStationMode ? <IdleStation onTimeout={onTimeout} /> : null;
}

function IdleStation({ onTimeout }: StationIdleLogoutProps) {
	const { data: settings } = useQuery(settingsQueries.public());
	const { state, stayLoggedIn } = useIdleLogout({
		enabled: true,
		idleMinutes:
			settings?.station_idle_logout_minutes ??
			config.station.idleLogoutFallbackMinutes,
		onTimeout,
	});

	return (
		<IdleLogoutDialog
			open={state.status === 'warning'}
			secondsLeft={state.status === 'warning' ? state.secondsLeft : 0}
			onStay={stayLoggedIn}
		/>
	);
}
