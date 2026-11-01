import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { Tooltip } from '@/shared/components/tooltip/tooltip';
import { appShellStyles, userPanelVariants } from './app-shell.styles';
import type { AppShellUser } from './app-shell.types';
import { getInitials } from './get-initials';

export type UserPanelProps = {
	user: AppShellUser;
	onLogout: () => void;
	isCollapsed?: boolean | undefined;
};

export function UserPanel({
	user,
	onLogout,
	isCollapsed = false,
}: UserPanelProps) {
	const { t } = useTranslation();

	return (
		<div className={userPanelVariants({ collapsed: isCollapsed })}>
			<span aria-hidden="true" className={appShellStyles.avatar}>
				{getInitials(user.name)}
			</span>
			{isCollapsed ? (
				<span className={appShellStyles.screenReaderOnly}>
					{user.name}, {user.roleLabel}
				</span>
			) : (
				<div className={appShellStyles.userText}>
					<span className={appShellStyles.userName}>{user.name}</span>
					<span className={appShellStyles.userRole}>{user.roleLabel}</span>
				</div>
			)}
			<Tooltip label={t('session.logout')} side="right">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={t('session.logout')}
					onClick={onLogout}
					className={appShellStyles.iconButton}
				>
					<LogOut aria-hidden="true" />
				</Button>
			</Tooltip>
		</div>
	);
}
