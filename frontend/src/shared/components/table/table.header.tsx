import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { tableStyles } from './table.styles';

export type TableHeaderProps = ComponentProps<'thead'>;

export function TableHeader({ className, ...props }: TableHeaderProps) {
	return <thead className={cn(tableStyles.header, className)} {...props} />;
}
