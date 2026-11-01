import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { cn } from '@/shared/lib/utils';
import { dialogStyles } from './dialog.styles';

export type DialogContentProps = Omit<DialogPrimitive.Popup.Props, 'title'> & {
	title: string;
};

/**
 * Renders the modal window with an overlay, a header holding `title` and a close button.
 * Put {@link DialogDescription}, {@link DialogBody} and {@link DialogFooter} inside; extra props go to the window element.
 */
export function DialogContent({
	title,
	children,
	className,
	...props
}: DialogContentProps) {
	const { t } = useTranslation();

	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Backdrop className={dialogStyles.overlay} />
			<DialogPrimitive.Popup
				className={cn(dialogStyles.popup, className)}
				{...props}
			>
				<header className={dialogStyles.header}>
					<DialogPrimitive.Title className={dialogStyles.title}>
						{title}
					</DialogPrimitive.Title>
					<DialogPrimitive.Close
						render={
							<Button
								variant="secondary"
								size="icon-sm"
								aria-label={t('dialog.close')}
							/>
						}
					>
						<X aria-hidden="true" />
					</DialogPrimitive.Close>
				</header>
				{children}
			</DialogPrimitive.Popup>
		</DialogPrimitive.Portal>
	);
}
