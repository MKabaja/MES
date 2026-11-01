import { cva } from 'class-variance-authority';

export const inputContainerVariants = cva(
	'flex w-full min-w-0 items-center gap-2 rounded-sm border border-border-input bg-bg px-3 font-sans font-normal text-text shadow-inset transition-colors focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent-hover has-aria-invalid:border-danger has-disabled:cursor-not-allowed has-disabled:border-border has-disabled:bg-surface has-disabled:text-text-2 has-disabled:shadow-none has-read-only:border-border has-read-only:bg-surface has-read-only:text-text-2 has-read-only:shadow-none',
	{
		variants: {
			size: {
				default: 'h-[45px] text-[15px]',
				terminal: 'h-14 text-lg',
			},
		},
		defaultVariants: { size: 'default' },
	},
);

export const inputStyles = {
	field:
		'h-full min-w-0 flex-1 bg-transparent text-inherit outline-none placeholder:text-text-3 disabled:cursor-not-allowed',
	icon: 'flex shrink-0 items-center text-text-3 [&_svg]:size-4 [&_svg]:[stroke-width:1.7]',
} satisfies Record<string, string>;
