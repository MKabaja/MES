import type { QueryClient } from '@tanstack/react-query';
import { createRouter, type RouterHistory } from '@tanstack/react-router';
import { queryClient } from './query-client';
import type { RouterContext } from './routes/__root';
import { routeTree } from './routeTree.gen';
import {
	RouteError,
	RouteNotFound,
	RoutePending,
} from './shared/components/route-fallbacks';

type AppRouterOptions = {
	history?: RouterHistory;
	queryClient?: QueryClient;
};

/**
 * Creates the application router; each call gets its own `queryClient` context.
 */
export function createAppRouter(options: AppRouterOptions = {}) {
	const context: RouterContext = {
		queryClient: options.queryClient ?? queryClient,
	};
	return createRouter({
		routeTree,
		context,
		defaultPreload: 'intent',
		defaultPendingComponent: RoutePending,
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: RouteNotFound,
		...(options.history ? { history: options.history } : {}),
	});
}

export const router = createAppRouter();

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
