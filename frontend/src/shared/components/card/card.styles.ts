import { cva } from 'class-variance-authority';

export const cardVariants = cva(
	'flex flex-col gap-3.5 rounded-md border border-border bg-surface text-text shadow-raised',
	{
		variants: {
			padding: {
				content: 'p-[18px]',
				list: 'p-5',
			},
		},
		defaultVariants: {
			padding: 'content',
		},
	},
);

export const cardStyles = {
	header: 'flex items-start justify-between gap-4',
} satisfies Record<string, string>;
