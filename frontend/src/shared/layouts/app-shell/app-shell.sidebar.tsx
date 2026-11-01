import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { Tooltip } from '@/shared/components/tooltip/tooltip';
import { Brand } from './app-shell.brand';
import { Nav } from './app-shell.nav';
import {
	appShellStyles,
	brandRowVariants,
	sidebarVariants,
} from './app-shell.styles';
import type { AppShellNavItem, AppShellUser } from './app-shell.types';
import { UserPanel } from './app-shell.user-panel';

export type SidebarProps = {
	user: AppShellUser;
	navItems: AppShellNavItem[];
	onLogout: () => void;
	isCollapsed: boolean;
	onToggleCollapsed: () => void;
};

export function Sidebar({
	user,
	navItems,
	onLogout,
	isCollapsed,
	onToggleCollapsed,
}: SidebarProps) {
	const { t } = useTranslation();
	const toggleLabel = isCollapsed
		? t('appShell.expandMenu')
		: t('appShell.collapseMenu');
	const ToggleIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

	return (
		<aside className={sidebarVariants({ collapsed: isCollapsed })}>
			<div className={brandRowVariants({ collapsed: isCollapsed })}>
				<Brand isCollapsed={isCollapsed} />
				<Tooltip label={toggleLabel} side="right">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={toggleLabel}
						onClick={onToggleCollapsed}
						className={appShellStyles.iconButton}
					>
						<ToggleIcon aria-hidden="true" />
					</Button>
				</Tooltip>
			</div>
			<Nav items={navItems} isCollapsed={isCollapsed} />
			<UserPanel user={user} onLogout={onLogout} isCollapsed={isCollapsed} />
		</aside>
	);
}
