export const checkboxStyles = {
	root: 'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border-input bg-bg text-on-accent shadow-inset transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent-hover data-checked:border-accent data-checked:bg-accent data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-surface data-disabled:shadow-none aria-invalid:border-danger',
	indicator: 'flex items-center justify-center',
	icon: 'size-3.5 [stroke-width:2.5]',
} satisfies Record<string, string>;
