import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireUser } from '@/features/auth/utils/session-guards';

export const Route = createFileRoute('/_auth')({
	beforeLoad: async ({ context, location }) => ({
		user: await requireUser(context.queryClient, location.href),
	}),
	component: Outlet,
});
