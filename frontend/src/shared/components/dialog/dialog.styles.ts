export const dialogStyles = {
	overlay:
		'fixed inset-0 z-50 bg-bg/55 backdrop-blur-[6px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
	popup:
		'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-surface-2 text-text shadow-raised outline-none transition-[opacity,scale] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
	header:
		'flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border px-6',
	title: 'font-mono text-[17px] leading-6 font-medium text-text',
	description: 'font-sans text-[15px] leading-[1.55] text-text-2',
	body: 'flex flex-col gap-4 overflow-y-auto p-6 font-sans text-[15px] leading-[1.55] text-text-2',
	footer:
		'flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4',
} satisfies Record<string, string>;
