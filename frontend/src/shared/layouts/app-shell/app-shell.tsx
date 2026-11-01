import type { ReactNode } from 'react';
import { MobileMenu } from './app-shell.mobile-menu';
import { Sidebar } from './app-shell.sidebar';
import { appShellStyles } from './app-shell.styles';
import type { AppShellNavItem, AppShellUser } from './app-shell.types';
import { useSidebarCollapsed } from './use-sidebar-collapsed';

export type AppShellProps = {
	user: AppShellUser;
	navItems: AppShellNavItem[];
	onLogout: () => void;
	isLoggingOut?: boolean | undefined;
	children: ReactNode;
};

/**
 * Renders the office layout: a collapsible sidebar on wide screens, a slide-in menu on narrow ones, and `children` as the page content.
 * It knows nothing about features: the user, menu items (with optional counters) and logout handler come from the caller.
 */
export function AppShell({
	user,
	navItems,
	onLogout,
	isLoggingOut = false,
	children,
}: AppShellProps) {
	const { isCollapsed, toggle } = useSidebarCollapsed();

	return (
		<div className={appShellStyles.root}>
			<Sidebar
				user={user}
				navItems={navItems}
				onLogout={onLogout}
				isLoggingOut={isLoggingOut}
				isCollapsed={isCollapsed}
				onToggleCollapsed={toggle}
			/>
			<div className={appShellStyles.content}>
				<MobileMenu
					user={user}
					navItems={navItems}
					onLogout={onLogout}
					isLoggingOut={isLoggingOut}
				/>
				<main className={appShellStyles.main}>{children}</main>
			</div>
		</div>
	);
}
