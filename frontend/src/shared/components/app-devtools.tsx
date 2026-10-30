import { lazy, Suspense } from 'react';

const DevtoolsPanels = import.meta.env.DEV
	? lazy(() =>
			import('./devtools-panels').then((module) => ({
				default: module.DevtoolsPanels,
			})),
		)
	: null;

/**
 * Renders the Router and Query devtools in development only; production builds drop them.
 */
export function AppDevtools() {
	if (!DevtoolsPanels) {
		return null;
	}
	return (
		<Suspense fallback={null}>
			<DevtoolsPanels />
		</Suspense>
	);
}
