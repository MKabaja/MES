import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { OfficeLayout } from '@/features/auth/components/office-layout/office-layout';
import { getHomePath } from '@/features/auth/utils/home-path';

export const Route = createFileRoute('/_auth/_admin')({
	beforeLoad: ({ context }) => {
		if (context.user.role !== 'admin') {
			throw redirect({ to: getHomePath(context.user.role), replace: true });
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { user } = Route.useRouteContext();

	return (
		<OfficeLayout user={user}>
			<Outlet />
		</OfficeLayout>
	);
}
