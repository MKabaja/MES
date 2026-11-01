import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { cardVariants } from './card.styles';

export type CardProps = ComponentProps<'section'> &
	VariantProps<typeof cardVariants>;

/**
 * Renders a raised surface that groups related content; `padding="list"` fits tables and lists.
 */
export function Card({ padding, className, ...props }: CardProps) {
	return (
		<section className={cn(cardVariants({ padding }), className)} {...props} />
	);
}
