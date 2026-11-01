import { LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/shared/layouts/app-shell/app-shell';
import type { AppShellNavItem } from '@/shared/layouts/app-shell/app-shell.types';
import { useSignOut } from '../../hooks/use-sign-out';
import type { User } from '../../model/auth.types';

export type OfficeLayoutProps = { user: User; children: ReactNode };

/**
 * Wraps office pages in the sidebar layout for `user` and wires its logout button.
 */
export function OfficeLayout({ user, children }: OfficeLayoutProps) {
	const { t } = useTranslation();
	const { signOut, isSigningOut } = useSignOut();
	const navItems: AppShellNavItem[] = [
		{ to: '/panel', label: t('nav.panel'), icon: LayoutDashboard },
	];

	return (
		<AppShell
			user={{ name: user.full_name, roleLabel: t(`session.role.${user.role}`) }}
			navItems={navItems}
			onLogout={signOut}
			isLoggingOut={isSigningOut}
		>
			{children}
		</AppShell>
	);
}
