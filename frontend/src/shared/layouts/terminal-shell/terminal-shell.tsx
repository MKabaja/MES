import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { Logo } from '@/shared/components/logo/logo';
import { formatTime } from '@/shared/lib/time';
import { CLOCK_REFRESH_INTERVAL_MILLISECONDS } from './terminal-shell.constants';
import { terminalShellStyles } from './terminal-shell.styles';
import { useCurrentTime } from './use-current-time';

export type TerminalShellProps = {
	operatorName: string;
	onLogout: () => void;
	isLoggingOut?: boolean | undefined;
	children: ReactNode;
};

/**
 * Renders the hall layout: a 64 px top bar with the app name, operator, plant-time clock and logout, above `children`.
 * It knows nothing about features: the operator name and logout handler come from the caller.
 */
export function TerminalShell({
	operatorName,
	onLogout,
	isLoggingOut = false,
	children,
}: TerminalShellProps) {
	const { t } = useTranslation();
	const nowIso = useCurrentTime(CLOCK_REFRESH_INTERVAL_MILLISECONDS);

	return (
		<div className={terminalShellStyles.root}>
			<header className={terminalShellStyles.topBar}>
				<div className={terminalShellStyles.brand}>
					<Logo />
					<span className={terminalShellStyles.brandName}>
						{t('brand.name')} {t('brand.tagline')}
					</span>
				</div>
				<span className={terminalShellStyles.operator}>{operatorName}</span>
				<time dateTime={nowIso} className={terminalShellStyles.clock}>
					{formatTime(nowIso)}
				</time>
				<Button
					variant="secondary"
					size="terminal"
					onClick={onLogout}
					disabled={isLoggingOut}
					className={terminalShellStyles.logout}
				>
					<LogOut aria-hidden="true" />
					{t('session.logout')}
				</Button>
			</header>
			<main className={terminalShellStyles.main}>{children}</main>
		</div>
	);
}
