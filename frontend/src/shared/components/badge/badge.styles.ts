import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
	'inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] font-mono text-[10.5px] leading-none font-bold uppercase select-none',
	{
		variants: {
			category: {
				teal: 'bg-cat-teal text-bg',
				violet: 'bg-cat-violet text-bg',
				pink: 'bg-cat-pink text-bg',
				gray: 'bg-cat-gray text-bg',
				neutral: 'bg-surface-2 text-text',
			},
		},
		defaultVariants: {
			category: 'neutral',
		},
	},
);
