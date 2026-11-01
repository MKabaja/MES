export const tableRowCellStyles = 'h-[70px] px-4';

export const tableStyles = {
	scroll:
		'w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover',
	table: 'w-full min-w-[960px] border-collapse text-left',
	header:
		'border-b border-border [&_tr]:h-8 [&_tr]:border-b-0 [&_tr]:hover:bg-transparent',
	row: 'border-b border-border transition-colors last:border-b-0 hover:bg-surface-2',
	head: 'px-4 font-mono text-xs font-medium tracking-[0.08em] whitespace-nowrap text-text-3 uppercase',
	cell: `${tableRowCellStyles} text-sm leading-5 font-medium text-text`,
	caption: 'sr-only',
} satisfies Record<string, string>;
