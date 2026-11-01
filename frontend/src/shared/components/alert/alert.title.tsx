import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { alertStyles } from './alert.styles';

export type AlertTitleProps = ComponentProps<'p'>;

/**
 * Renders the short headline of an {@link Alert}.
 */
export function AlertTitle({ className, ...props }: AlertTitleProps) {
	return <p className={cn(alertStyles.title, className)} {...props} />;
}
