import { Link } from '@tanstack/react-router';
import { Tooltip } from '@/shared/components/tooltip/tooltip';
import { appShellStyles, navItemVariants } from './app-shell.styles';
import type { AppShellNavItem } from './app-shell.types';

export type NavItemProps = {
	item: AppShellNavItem;
	isCollapsed: boolean;
	onNavigate?: (() => void) | undefined;
};

export function NavItem({ item, isCollapsed, onNavigate }: NavItemProps) {
	const { to, label, icon: Icon, counter } = item;
	const hasCounter = counter !== undefined && counter > 0;

	const link = (
		<Link
			to={to}
			onClick={onNavigate}
			className={navItemVariants({ collapsed: isCollapsed })}
		>
			<Icon aria-hidden="true" />
			<span
				className={
					isCollapsed
						? appShellStyles.screenReaderOnly
						: appShellStyles.navLabel
				}
			>
				{label}
			</span>
			{hasCounter ? (
				<NavCounter value={counter} isCollapsed={isCollapsed} />
			) : null}
		</Link>
	);

	return (
		<li>
			{isCollapsed ? (
				<Tooltip label={label} side="right">
					{link}
				</Tooltip>
			) : (
				link
			)}
		</li>
	);
}

type NavCounterProps = { value: number; isCollapsed: boolean };

function NavCounter({ value, isCollapsed }: NavCounterProps) {
	if (isCollapsed) {
		return (
			<>
				<span aria-hidden="true" className={appShellStyles.counterDot} />
				<span className={appShellStyles.screenReaderOnly}>{value}</span>
			</>
		);
	}

	return <span className={appShellStyles.counter}>{value}</span>;
}
