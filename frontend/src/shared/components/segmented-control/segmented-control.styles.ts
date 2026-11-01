export const segmentedControlStyles = {
	root: 'group/segmented inline-flex gap-1 rounded-md border border-border-input bg-bg p-1 shadow-inset',
	option:
		'inline-flex h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-transparent px-4 font-sans text-[13px] font-medium whitespace-nowrap text-text-2 transition-colors outline-none select-none group-data-[size=terminal]/segmented:h-14 group-data-[size=terminal]/segmented:px-6 group-data-[size=terminal]/segmented:text-lg hover:text-text focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent-hover data-checked:border-border data-checked:bg-surface-2 data-checked:text-text data-checked:shadow-raised-sm data-disabled:cursor-not-allowed data-disabled:text-text-3 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.7]',
} satisfies Record<string, string>;
