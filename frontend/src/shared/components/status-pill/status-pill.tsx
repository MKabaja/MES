import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { statusPillVariants } from './status-pill.styles';

export type StatusPillProps = ComponentProps<'span'> &
	VariantProps<typeof statusPillVariants>;

/**
 * Renders a status as a pill; put the status name in `children` and an optional icon before it, never colour alone.
 */
export function StatusPill({
	variant,
	size,
	className,
	...props
}: StatusPillProps) {
	return (
		<span
			className={cn(statusPillVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
