export const routeFallbackStyles = {
	container:
		'flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-text',
	title: 'text-xl font-semibold',
	description: 'text-text-2',
	action:
		'rounded-md bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
} satisfies Record<string, string>;
