import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SessionLayout } from '@/features/auth/components/session-layout/session-layout';
import { requireUser } from '@/features/auth/utils/session-guards';

export const Route = createFileRoute('/_auth')({
	beforeLoad: async ({ context, location }) => ({
		user: await requireUser(context.queryClient, location.href),
	}),
	component: SessionLayoutRoute,
});

function SessionLayoutRoute() {
	return (
		<SessionLayout>
			<Outlet />
		</SessionLayout>
	);
}
