import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from './button.styles';

export type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
	VariantProps<typeof buttonVariants> & { className?: string };

/**
 * Renders a design-system button; icon-only buttons must get an `aria-label`.
 */
export function Button({ variant, size, className, ...props }: ButtonProps) {
	return (
		<ButtonPrimitive
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
