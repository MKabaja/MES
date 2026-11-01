import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { SignOutGate } from '@/features/auth/components/sign-out-gate/sign-out-gate';
import { AppDevtools } from '@/shared/components/app-devtools';
import { Toaster } from '@/shared/components/toaster/toaster';

export type RouterContext = { queryClient: QueryClient };

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<SignOutGate>
				<Outlet />
			</SignOutGate>
			<Toaster />
			<AppDevtools />
		</>
	);
}
