import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { dialogStyles } from './dialog.styles';

export type DialogFormProps = ComponentProps<'form'>;

/**
 * Renders a `form` that wraps {@link DialogBody} and {@link DialogFooter} so the body scrolls while the footer stays visible.
 */
export function DialogForm({ className, ...props }: DialogFormProps) {
	return <form className={cn(dialogStyles.form, className)} {...props} />;
}
