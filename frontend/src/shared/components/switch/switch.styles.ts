export const switchStyles = {
	root: 'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border-input bg-bg p-0.5 shadow-inset transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent-hover data-checked:border-accent data-checked:bg-accent data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-surface data-disabled:shadow-none aria-invalid:border-danger',
	thumb:
		'pointer-events-none block size-4.5 rounded-full bg-text-2 shadow-raised-sm transition-transform data-checked:translate-x-5 data-checked:bg-on-accent data-disabled:bg-text-3',
} satisfies Record<string, string>;
