import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { tableStyles } from './table.styles';

export type TableRowProps = ComponentProps<'tr'>;

export function TableRow({ className, ...props }: TableRowProps) {
	return <tr className={cn(tableStyles.row, className)} {...props} />;
}
