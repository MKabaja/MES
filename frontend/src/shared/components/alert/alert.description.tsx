import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { alertStyles } from './alert.styles';

export type AlertDescriptionProps = ComponentProps<'p'>;

/**
 * Renders the supporting text of an {@link Alert}.
 */
export function AlertDescription({
	className,
	...props
}: AlertDescriptionProps) {
	return <p className={cn(alertStyles.description, className)} {...props} />;
}
