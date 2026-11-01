import { cva } from 'class-variance-authority';

export const statusPillVariants = cva(
	[
		'inline-flex items-center gap-1.5 rounded-full border border-(--pill-color) bg-[color-mix(in_srgb,var(--pill-color)_13%,var(--color-surface))] font-sans font-medium whitespace-nowrap text-text',
		'[&_svg]:shrink-0 [&_svg]:text-(--pill-color) [&_svg]:[stroke-width:1.7]',
	],
	{
		variants: {
			variant: {
				ok: '[--pill-color:var(--color-success)]',
				warn: '[--pill-color:var(--color-warning)]',
				bad: '[--pill-color:var(--color-danger)]',
				info: '[--pill-color:var(--color-accent-hover)]',
				pending: '[--pill-color:var(--color-cat-gray)]',
				in_progress: '[--pill-color:var(--color-accent)]',
				paused: '[--pill-color:var(--color-warning)]',
				completed: '[--pill-color:var(--color-success)]',
			},
			size: {
				default: 'h-6 px-2.5 text-[12.5px] [&_svg]:size-[13px]',
				terminal: 'h-8 px-3.5 text-base [&_svg]:size-4',
			},
		},
		defaultVariants: {
			variant: 'info',
			size: 'default',
		},
	},
);
