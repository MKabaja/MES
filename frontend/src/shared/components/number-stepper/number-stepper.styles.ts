import { cva } from 'class-variance-authority';

export const numberStepperVariants = cva('inline-flex items-center', {
	variants: {
		size: {
			default: 'gap-2',
			terminal: 'gap-4',
		},
	},
	defaultVariants: { size: 'default' },
});

export const numberStepperInputVariants = cva(
	'min-w-0 rounded-sm border border-border-input bg-bg text-center font-mono text-text tabular-nums shadow-inset transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-hover aria-invalid:border-danger read-only:border-border read-only:bg-surface read-only:text-text-2 read-only:shadow-none disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-2 disabled:shadow-none',
	{
		variants: {
			size: {
				default: 'h-[45px] w-20 text-[15px] font-normal',
				terminal: 'h-14 w-32 text-[32px] leading-none font-bold',
			},
		},
		defaultVariants: { size: 'default' },
	},
);
