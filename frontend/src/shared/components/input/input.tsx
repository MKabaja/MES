import { Input as InputPrimitive } from '@base-ui/react/input';
import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { inputContainerVariants, inputStyles } from './input.styles';

export type InputProps = Omit<InputPrimitive.Props, 'className' | 'size'> &
	VariantProps<typeof inputContainerVariants> & {
		startIcon?: ReactNode | undefined;
		endIcon?: ReactNode | undefined;
		className?: string | undefined;
	};

/**
 * Renders a text input in a bordered container with optional decorative icons.
 * Picks up label, description and error wiring from an enclosing `Field`; `className` styles the container.
 */
export function Input({
	size,
	startIcon,
	endIcon,
	className,
	...props
}: InputProps) {
	return (
		<div className={cn(inputContainerVariants({ size }), className)}>
			{startIcon ? (
				<span aria-hidden="true" className={inputStyles.icon}>
					{startIcon}
				</span>
			) : null}
			<InputPrimitive className={inputStyles.field} {...props} />
			{endIcon ? (
				<span aria-hidden="true" className={inputStyles.icon}>
					{endIcon}
				</span>
			) : null}
		</div>
	);
}
