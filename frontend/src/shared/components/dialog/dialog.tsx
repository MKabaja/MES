import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

export type DialogProps = DialogPrimitive.Root.Props;

/**
 * Provides open state for a modal dialog; control it with `open` and `onOpenChange`.
 * Compose it with {@link DialogContent}, {@link DialogBody} and {@link DialogFooter}.
 */
export function Dialog(props: DialogProps) {
	return <DialogPrimitive.Root {...props} />;
}
