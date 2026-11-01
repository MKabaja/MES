import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { Dialog } from '@/shared/components/dialog/dialog';
import { Brand } from './app-shell.brand';
import { Nav } from './app-shell.nav';
import { appShellStyles, brandRowVariants } from './app-shell.styles';
import type { AppShellNavItem, AppShellUser } from './app-shell.types';
import { UserPanel } from './app-shell.user-panel';
import { useCloseOnDesktop } from './use-close-on-desktop';

export type MobileMenuProps = {
	user: AppShellUser;
	navItems: AppShellNavItem[];
	onLogout: () => void;
	isLoggingOut: boolean;
};

export function MobileMenu({
	user,
	navItems,
	onLogout,
	isLoggingOut,
}: MobileMenuProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	function closeMenu() {
		setIsOpen(false);
	}

	useCloseOnDesktop(closeMenu);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<header className={appShellStyles.topBar}>
				<DialogPrimitive.Trigger
					render={
						<Button
							variant="secondary"
							size="icon-sm"
							aria-label={t('appShell.openMenu')}
						/>
					}
				>
					<Menu aria-hidden="true" />
				</DialogPrimitive.Trigger>
				<Brand />
			</header>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className={appShellStyles.overlay} />
				<DialogPrimitive.Popup className={appShellStyles.drawer}>
					<DialogPrimitive.Title className={appShellStyles.screenReaderOnly}>
						{t('appShell.mainMenu')}
					</DialogPrimitive.Title>
					<div className={brandRowVariants()}>
						<Brand />
						<DialogPrimitive.Close
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t('dialog.close')}
									className={appShellStyles.iconButton}
								/>
							}
						>
							<X aria-hidden="true" />
						</DialogPrimitive.Close>
					</div>
					<Nav items={navItems} onNavigate={closeMenu} />
					<UserPanel
						user={user}
						onLogout={onLogout}
						isLoggingOut={isLoggingOut}
					/>
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</Dialog>
	);
}
