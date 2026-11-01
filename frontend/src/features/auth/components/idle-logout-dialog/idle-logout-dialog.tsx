import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { Dialog } from '@/shared/components/dialog/dialog';
import { DialogContent } from '@/shared/components/dialog/dialog.content';
import { DialogDescription } from '@/shared/components/dialog/dialog.description';
import { DialogFooter } from '@/shared/components/dialog/dialog.footer';

export type IdleLogoutDialogProps = {
	open: boolean;
	secondsLeft: number;
	onStay: () => void;
};

/**
 * Warns that the session ends in `secondsLeft` seconds; the "stay" button, Escape and the close button all call `onStay`.
 * The countdown is not a live region, so a screen reader announces the text once, when the window opens.
 */
export function IdleLogoutDialog({
	open,
	secondsLeft,
	onStay,
}: IdleLogoutDialogProps) {
	const { t } = useTranslation();
	const stayButtonRef = useRef<HTMLButtonElement>(null);

	function handleOpenChange(nextOpen: boolean): void {
		if (!nextOpen) {
			onStay();
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				role="alertdialog"
				title={t('auth.idleLogout.title')}
				initialFocus={stayButtonRef}
				density="terminal"
			>
				<DialogDescription>
					{t('auth.idleLogout.description', { seconds: secondsLeft })}
				</DialogDescription>
				<DialogFooter>
					<Button ref={stayButtonRef} size="terminal" onClick={onStay}>
						{t('auth.idleLogout.stay')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
