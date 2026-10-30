import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

/**
 * Groups the Query and Router devtools panels for lazy loading in development.
 */
export function DevtoolsPanels() {
	return (
		<>
			<ReactQueryDevtools buttonPosition="bottom-left" />
			<TanStackRouterDevtools position="bottom-right" />
		</>
	);
}
