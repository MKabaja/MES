import { createFileRoute, redirect } from '@tanstack/react-router';
import { LOGIN_PATH } from '@/features/auth/model/auth.constants';
import { getHomePath } from '@/features/auth/utils/home-path';
import { loadSessionUser } from '@/features/auth/utils/session-guards';

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const user = await loadSessionUser(context.queryClient);
		if (!user) {
			throw redirect({ to: LOGIN_PATH, replace: true });
		}
		throw redirect({ to: getHomePath(user.role), replace: true });
	},
});
