import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { badgeVariants } from './badge.styles';

export type BadgeProps = Omit<ComponentProps<'span'>, 'children'> &
	VariantProps<typeof badgeVariants> & { letter: string };

/**
 * Renders a letter badge in a category colour; always place it next to the full name it abbreviates.
 */
export function Badge({ letter, category, className, ...props }: BadgeProps) {
	return (
		<span
			aria-hidden="true"
			className={cn(badgeVariants({ category }), className)}
			{...props}
		>
			{letter}
		</span>
	);
}
