import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
	[
		'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border font-sans font-semibold whitespace-nowrap transition-colors select-none',
		'[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.7]',
		'enabled:not-aria-disabled:active:translate-y-px enabled:not-aria-disabled:active:shadow-inset',
		'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-3 disabled:shadow-none',
		'aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-surface aria-disabled:text-text-3 aria-disabled:shadow-none',
	],
	{
		variants: {
			variant: {
				primary:
					'border-transparent bg-accent text-on-accent shadow-[var(--shadow-raised-sm),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-accent-hover',
				secondary:
					'border-border-input bg-surface text-text shadow-raised-sm hover:bg-surface-2',
				ghost:
					'border-transparent bg-transparent text-accent-hover shadow-none hover:bg-surface-2',
				success:
					'border-success bg-surface text-success shadow-raised-sm hover:bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))]',
				danger:
					'border-danger bg-surface text-danger shadow-raised-sm hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-surface))]',
			},
			size: {
				default: 'h-10 px-4 text-sm leading-none',
				sm: 'h-8 px-4 text-[13px] leading-none',
				icon: 'size-10',
				'icon-sm': 'size-8',
				terminal: 'h-16 px-6 text-lg leading-none [&_svg]:size-6',
				'icon-terminal': 'size-14 [&_svg]:size-6',
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'default',
		},
	},
);
