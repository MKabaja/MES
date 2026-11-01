import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { SessionIdleLogout } from '@/features/auth/components/session-idle-logout/session-idle-logout';
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
			<SessionIdleLogout />
			<Toaster />
			<AppDevtools />
		</>
	);
}
