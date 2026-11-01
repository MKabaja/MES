import type { ReactNode } from 'react';
import { useSignOut } from '../../hooks/use-sign-out';
import { StationIdleLogout } from '../station-idle-logout/station-idle-logout';

export type SessionLayoutProps = { children: ReactNode };

/**
 * Wraps every signed-in page and logs out an idle station for any role.
 */
export function SessionLayout({ children }: SessionLayoutProps) {
	const { signOutIdleStation } = useSignOut();

	return (
		<>
			{children}
			<StationIdleLogout onTimeout={signOutIdleStation} />
		</>
	);
}
