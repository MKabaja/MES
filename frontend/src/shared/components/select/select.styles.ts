export const selectStyles = {
	trigger:
		'flex h-[45px] w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-border-input bg-bg px-3 font-sans text-[15px] font-normal text-text shadow-inset transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-hover aria-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-surface data-disabled:text-text-2 data-disabled:shadow-none',
	value: 'truncate data-placeholder:text-text-3',
	icon: 'size-4 shrink-0 text-text-3 [stroke-width:1.7]',
	positioner: 'z-50',
	popup:
		'max-h-(--available-height) w-(--anchor-width) min-w-36 overflow-y-auto rounded-md border border-border bg-surface-2 p-1 text-text shadow-raised outline-none',
	item: 'relative flex min-h-9 cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-3 text-sm font-medium outline-none select-none data-disabled:cursor-not-allowed data-disabled:text-text-3 data-highlighted:bg-border',
	itemIndicator:
		'pointer-events-none absolute right-2 flex size-4 items-center justify-center text-accent-hover',
	itemIcon: 'size-4 [stroke-width:1.7]',
} satisfies Record<string, string>;
