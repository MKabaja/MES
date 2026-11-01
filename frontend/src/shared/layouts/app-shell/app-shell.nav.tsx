import { useTranslation } from 'react-i18next';
import { NavItem } from './app-shell.nav-item';
import { appShellStyles } from './app-shell.styles';
import type { AppShellNavItem } from './app-shell.types';

export type NavProps = {
	items: AppShellNavItem[];
	isCollapsed?: boolean;
	onNavigate?: (() => void) | undefined;
};

export function Nav({ items, isCollapsed = false, onNavigate }: NavProps) {
	const { t } = useTranslation();

	return (
		<nav aria-label={t('appShell.mainMenu')} className={appShellStyles.nav}>
			<ul className={appShellStyles.navList}>
				{items.map((item) => (
					<NavItem
						key={item.to}
						item={item}
						isCollapsed={isCollapsed}
						onNavigate={onNavigate}
					/>
				))}
			</ul>
		</nav>
	);
}
