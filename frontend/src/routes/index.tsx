import { createFileRoute, redirect } from '@tanstack/react-router';
import { getHomePath } from '@/features/auth/utils/home-path';
import { loadSessionUser } from '@/features/auth/utils/session-guards';

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const user = await loadSessionUser(context.queryClient);
		if (!user) {
			throw redirect({ to: '/login', replace: true });
		}
		throw redirect({ to: getHomePath(user.role), replace: true });
	},
});
