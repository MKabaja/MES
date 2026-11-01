import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { wellStyles } from './well.styles';

export type WellProps = ComponentProps<'div'>;

/**
 * Renders a pressed-in field for numbers and empty states inside a card.
 */
export function Well({ className, ...props }: WellProps) {
	return <div className={cn(wellStyles.root, className)} {...props} />;
}
