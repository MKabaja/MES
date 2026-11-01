import { cva } from 'class-variance-authority';

export const appShellStyles = {
	root: 'flex min-h-dvh bg-bg text-text',
	content: 'flex min-w-0 flex-1 flex-col',
	main: 'flex min-w-0 flex-1 flex-col gap-6 p-4 lg:p-8',
	topBar:
		'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden',
	brandText: 'flex min-w-0 flex-1 flex-col',
	brandName: 'font-mono text-sm leading-5 font-bold text-text',
	brandTagline: 'font-sans text-[13px] leading-[18px] text-text-3',
	nav: 'flex-1 overflow-y-auto p-4',
	navList: 'flex flex-col gap-0.5',
	navLabel: 'min-w-0 flex-1 truncate',
	screenReaderOnly: 'sr-only',
	counter:
		'inline-flex h-[18px] min-w-5 items-center justify-center rounded-full bg-warning px-1.5 font-mono text-[11.5px] leading-none font-bold text-bg tabular-nums',
	counterDot: 'absolute top-1.5 right-1.5 size-[9px] rounded-full bg-warning',
	avatar:
		'flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-mono text-xs font-bold text-text shadow-raised-sm select-none',
	userText: 'flex min-w-0 flex-1 flex-col',
	userName: 'truncate font-sans text-sm leading-5 font-medium text-text',
	userRole: 'truncate font-sans text-[13px] leading-[18px] text-text-3',
	iconButton: 'size-7 text-text-2 hover:text-text',
	overlay:
		'fixed inset-0 z-50 bg-bg/55 backdrop-blur-[6px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none lg:hidden',
	drawer:
		'fixed inset-y-0 left-0 z-50 flex w-[248px] max-w-[calc(100%-3rem)] flex-col border-r border-border bg-surface text-text shadow-raised outline-none transition-transform data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none lg:hidden',
} satisfies Record<string, string>;

export const sidebarVariants = cva(
	'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] motion-reduce:transition-none lg:flex',
	{
		variants: {
			collapsed: {
				true: 'w-[72px]',
				false: 'w-[248px]',
			},
		},
		defaultVariants: { collapsed: false },
	},
);

export const brandRowVariants = cva('flex items-center px-4 pt-5 pb-4', {
	variants: {
		collapsed: {
			true: 'flex-col gap-3',
			false: 'gap-3',
		},
	},
	defaultVariants: { collapsed: false },
});

export const navItemVariants = cva(
	'relative flex h-10 items-center rounded-sm font-sans text-sm leading-5 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text data-[status=active]:bg-navy data-[status=active]:text-text data-[status=active]:shadow-inset data-[status=active]:hover:bg-navy [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.7]',
	{
		variants: {
			collapsed: {
				true: 'justify-center',
				false: 'gap-3 px-3',
			},
		},
		defaultVariants: { collapsed: false },
	},
);

export const userPanelVariants = cva(
	'flex items-center border-t border-border p-4',
	{
		variants: {
			collapsed: {
				true: 'flex-col gap-3',
				false: 'gap-3',
			},
		},
		defaultVariants: { collapsed: false },
	},
);
