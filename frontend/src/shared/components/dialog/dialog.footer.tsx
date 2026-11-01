import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { dialogStyles } from './dialog.styles';

export type DialogFooterProps = ComponentProps<'footer'>;

/**
 * Renders the action row of a {@link DialogContent}, aligned to the right.
 */
export function DialogFooter({ className, ...props }: DialogFooterProps) {
	return <footer className={cn(dialogStyles.footer, className)} {...props} />;
}
