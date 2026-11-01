import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { cn } from '@/shared/lib/utils';
import { dialogStyles } from './dialog.styles';

export type DialogDensity = 'default' | 'terminal';

type CloseButtonSize = 'icon-sm' | 'icon-terminal';

type CloseButtonSizeByDensity = Record<DialogDensity, CloseButtonSize>;

const closeButtonSizeByDensity: CloseButtonSizeByDensity = {
	default: 'icon-sm',
	terminal: 'icon-terminal',
};

export type DialogContentProps = Omit<
	DialogPrimitive.Popup.Props,
	'title' | 'className'
> & {
	title: string;
	className?: string | undefined;
	/** `terminal` enlarges the close button to a touch target for the hall terminal. */
	density?: DialogDensity | undefined;
};

/**
 * Renders the modal window with an overlay, a header holding `title` and a close button.
 * Put {@link DialogDescription}, {@link DialogBody} and {@link DialogFooter} inside; extra props go to the window element.
 * For a form, wrap body and footer in {@link DialogForm} so only the body scrolls.
 *
 * @example
 * <DialogContent title="Nowy materiał">
 *   <DialogForm onSubmit={handleSubmit}>
 *     <DialogBody>...</DialogBody>
 *     <DialogFooter>...</DialogFooter>
 *   </DialogForm>
 * </DialogContent>
 */
export function DialogContent({
	title,
	children,
	className,
	density = 'default',
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
								size={closeButtonSizeByDensity[density]}
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
