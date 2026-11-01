import type { ReactNode } from 'react';
import { TerminalShell } from '@/shared/layouts/terminal-shell/terminal-shell';
import { useSignOut } from '../../hooks/use-sign-out';
import type { User } from '../../model/auth.types';
import { StationIdleLogout } from '../station-idle-logout/station-idle-logout';

export type HallLayoutProps = { user: User; children: ReactNode };

/**
 * Wraps hall pages in the terminal top bar for `user` and wires its logout button.
 */
export function HallLayout({ user, children }: HallLayoutProps) {
	const { signOut, signOutIdleStation, isSigningOut } = useSignOut();

	return (
		<TerminalShell
			operatorName={user.full_name}
			onLogout={signOut}
			isLoggingOut={isSigningOut}
		>
			{children}
			<StationIdleLogout onTimeout={signOutIdleStation} />
		</TerminalShell>
	);
}
