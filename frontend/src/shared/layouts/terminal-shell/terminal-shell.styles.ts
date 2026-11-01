export const terminalShellStyles = {
	root: 'flex min-h-dvh flex-col bg-bg text-text',
	topBar:
		'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface px-4 sm:gap-4 sm:px-6',
	brand: 'flex shrink-0 items-center gap-3 sm:flex-1',
	brandName: 'hidden font-mono text-sm leading-5 font-bold text-text sm:block',
	operator:
		'min-w-0 flex-1 truncate text-right font-sans text-base leading-6 font-medium text-text sm:flex-initial',
	clock:
		'shrink-0 font-mono text-[17px] leading-6 font-medium tabular-nums text-text',
	logout: 'h-14 shrink-0',
	main: 'flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6',
} satisfies Record<string, string>;
