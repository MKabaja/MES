import { Field as FieldPrimitive } from '@base-ui/react/field';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { textareaStyles } from './textarea.styles';

export type TextareaProps = ComponentProps<'textarea'>;

/**
 * Renders a multi-line text field that picks up label, description and error wiring from an enclosing `Field`.
 */
export function Textarea({ className, ...props }: TextareaProps) {
	return (
		<FieldPrimitive.Control
			render={
				<textarea className={cn(textareaStyles.root, className)} {...props} />
			}
		/>
	);
}
