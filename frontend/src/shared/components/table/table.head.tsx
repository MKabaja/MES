import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { tableStyles } from './table.styles';

export type TableHeadProps = ComponentProps<'th'>;

export function TableHead({ className, ...props }: TableHeadProps) {
	return (
		<th scope="col" className={cn(tableStyles.head, className)} {...props} />
	);
}
