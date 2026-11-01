export const toasterStyles = {
	toast:
		'flex w-(--width) items-start gap-3 rounded-md border border-l-4 border-border border-l-(--toast-color) bg-surface px-4 py-3.5 font-sans text-text shadow-raised-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent-hover [&>*]:transition-opacity [&[data-expanded=false][data-front=false]>*]:opacity-0',
	content: 'flex min-w-0 flex-col gap-0.5',
	title: 'text-[15px] leading-snug font-semibold text-text',
	description: 'text-sm leading-snug text-text-2',
	icon: 'mt-px flex size-[18px] shrink-0 items-center justify-center text-(--toast-color) [&_svg]:size-[18px] [&_svg]:[stroke-width:1.7]',
	info: '[--toast-color:var(--color-accent-hover)]',
	success: '[--toast-color:var(--color-success)]',
	warning: '[--toast-color:var(--color-warning)]',
	error: '[--toast-color:var(--color-danger)]',
	default: '[--toast-color:var(--color-accent-hover)]',
} satisfies Record<string, string>;
