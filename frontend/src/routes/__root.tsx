import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { AppDevtools } from '@/shared/components/app-devtools';

export type RouterContext = { queryClient: QueryClient };

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<Outlet />
			<AppDevtools />
		</>
	);
}
