import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { tableStyles } from './table.styles';

export type TableCaptionProps = ComponentProps<'caption'>;

/**
 * Names the table for assistive technology; visually hidden.
 */
export function TableCaption({ className, ...props }: TableCaptionProps) {
	return <caption className={cn(tableStyles.caption, className)} {...props} />;
}
