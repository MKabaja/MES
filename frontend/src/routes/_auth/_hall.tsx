import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { HallLayout } from '@/features/auth/components/hall-layout/hall-layout';
import { getHomePath } from '@/features/auth/utils/home-path';

export const Route = createFileRoute('/_auth/_hall')({
	beforeLoad: ({ context }) => {
		if (context.user.role !== 'worker') {
			throw redirect({ to: getHomePath(context.user.role), replace: true });
		}
	},
	component: HallLayoutRoute,
});

function HallLayoutRoute() {
	const { user } = Route.useRouteContext();

	return (
		<HallLayout user={user}>
			<Outlet />
		</HallLayout>
	);
}
