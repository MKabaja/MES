import type { ReactNode } from 'react';
import { StationIdleLogout } from '../station-idle-logout/station-idle-logout';
import { useSignOut } from '../use-sign-out';

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
