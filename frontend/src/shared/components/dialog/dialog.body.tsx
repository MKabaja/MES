import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { dialogStyles } from './dialog.styles';

export type DialogBodyProps = ComponentProps<'div'>;

/**
 * Renders the scrollable content area of a {@link DialogContent}.
 */
export function DialogBody({ className, ...props }: DialogBodyProps) {
	return <div className={cn(dialogStyles.body, className)} {...props} />;
}
