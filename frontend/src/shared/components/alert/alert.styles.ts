import { cva } from 'class-variance-authority';

export const alertVariants = cva(
	'flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3.5 text-text shadow-raised-sm',
	{
		variants: {
			variant: {
				info: 'border-l-4 border-l-(--alert-color) [--alert-color:var(--color-accent-hover)]',
				success:
					'border-l-4 border-l-(--alert-color) [--alert-color:var(--color-success)]',
				warning:
					'border-l-4 border-l-(--alert-color) [--alert-color:var(--color-warning)]',
				danger:
					'border-l-4 border-l-(--alert-color) [--alert-color:var(--color-danger)]',
				exception:
					'border-dashed border-warning bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--color-surface))] [--alert-color:var(--color-warning)]',
			},
		},
		defaultVariants: {
			variant: 'info',
		},
	},
);

export const alertStyles = {
	icon: 'mt-px size-[18px] shrink-0 text-(--alert-color) [stroke-width:1.7]',
	content: 'flex min-w-0 flex-col gap-0.5',
	title: 'font-sans text-[15px] leading-snug font-semibold text-text',
	description: 'font-sans text-sm leading-snug text-text-2',
} satisfies Record<string, string>;
