export const loginPageStyles = {
	root: 'flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg p-4',
	card: 'flex w-full max-w-105 flex-col gap-6 rounded-lg border border-border bg-surface p-8 shadow-raised',
	brand: 'flex items-center gap-3',
	brandName: 'font-mono text-lg leading-6 font-bold text-text',
	heading: 'flex flex-col gap-1',
	title: 'text-xl leading-[26px]',
	subtitle: 'text-[13px] leading-5 text-text-3',
	support: 'max-w-105 text-center text-[13px] leading-5 text-text-3',
} satisfies Record<string, string>;
