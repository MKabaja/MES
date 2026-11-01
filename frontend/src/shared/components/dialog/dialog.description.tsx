import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/shared/lib/utils';
import { dialogStyles } from './dialog.styles';

export type DialogDescriptionProps = Omit<
	DialogPrimitive.Description.Props,
	'render'
>;

/**
 * Renders a paragraph that screen readers announce as the description of the surrounding {@link DialogContent}.
 */
export function DialogDescription({
	className,
	...props
}: DialogDescriptionProps) {
	return (
		<DialogPrimitive.Description
			render={<p />}
			className={cn(dialogStyles.description, className)}
			{...props}
		/>
	);
}
