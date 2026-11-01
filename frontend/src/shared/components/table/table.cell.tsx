import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { tableStyles } from './table.styles';

export type TableCellProps = ComponentProps<'td'>;

export function TableCell({ className, ...props }: TableCellProps) {
	return <td className={cn(tableStyles.cell, className)} {...props} />;
}
