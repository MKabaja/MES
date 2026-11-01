import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { tableStyles } from './table.styles';

export type TableProps = ComponentProps<'table'> & { label: string };

/**
 * Renders a semantic data table inside a horizontally scrollable region (keyboard-focusable in current browsers) named by `label`.
 * Add a `TableCaption` when the table itself needs an accessible name.
 */
export function Table({ label, className, ...props }: TableProps) {
	return (
		<section aria-label={label} className={tableStyles.scroll}>
			<table className={cn(tableStyles.table, className)} {...props} />
		</section>
	);
}
