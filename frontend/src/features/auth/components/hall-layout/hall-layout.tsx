import type { ReactNode } from 'react';
import { TerminalShell } from '@/shared/layouts/terminal-shell/terminal-shell';
import type { User } from '../../model/auth.types';
import { useSignOut } from '../use-sign-out';

export type HallLayoutProps = { user: User; children: ReactNode };

/**
 * Wraps hall pages in the terminal top bar for `user` and wires its logout button.
 */
export function HallLayout({ user, children }: HallLayoutProps) {
	const { signOut, isSigningOut } = useSignOut();

	return (
		<TerminalShell
			operatorName={user.full_name}
			onLogout={signOut}
			isLoggingOut={isSigningOut}
		>
			{children}
		</TerminalShell>
	);
}
