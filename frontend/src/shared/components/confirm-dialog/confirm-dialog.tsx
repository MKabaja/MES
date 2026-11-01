import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { dialogStyles } from '@/shared/components/dialog/dialog.styles';
import { Spinner } from '@/shared/components/spinner/spinner';

export type ConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	onConfirm: () => void;
	variant?: 'default' | 'danger';
	pending?: boolean;
};

/**
 * Asks the user to confirm an action; it does not close itself, so the caller closes it from `onOpenChange` or after `onConfirm` succeeds.
 * While `pending` the buttons are disabled, a spinner shows in the action and Escape or outside clicks are ignored.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	onConfirm,
	variant = 'default',
	pending = false,
}: ConfirmDialogProps) {
	const { t } = useTranslation();

	function handleOpenChange(nextOpen: boolean) {
		if (!pending) {
			onOpenChange(nextOpen);
		}
	}

	return (
		<AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
			<AlertDialogPrimitive.Portal>
				<AlertDialogPrimitive.Backdrop className={dialogStyles.overlay} />
				<AlertDialogPrimitive.Popup className={dialogStyles.popup}>
					<header className={dialogStyles.header}>
						<AlertDialogPrimitive.Title className={dialogStyles.title}>
							{title}
						</AlertDialogPrimitive.Title>
					</header>
					<div className={dialogStyles.body}>
						<AlertDialogPrimitive.Description render={<p />}>
							{description}
						</AlertDialogPrimitive.Description>
					</div>
					<footer className={dialogStyles.footer}>
						<AlertDialogPrimitive.Close
							disabled={pending}
							render={<Button variant="secondary" />}
						>
							{t('dialog.cancel')}
						</AlertDialogPrimitive.Close>
						<Button
							variant={variant === 'danger' ? 'danger' : 'primary'}
							disabled={pending}
							focusableWhenDisabled
							aria-busy={pending}
							onClick={onConfirm}
						>
							{pending ? <Spinner /> : null}
							{confirmLabel}
						</Button>
					</footer>
				</AlertDialogPrimitive.Popup>
			</AlertDialogPrimitive.Portal>
		</AlertDialogPrimitive.Root>
	);
}
