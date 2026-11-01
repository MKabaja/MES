import { useNavigate, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/i18n/error-message';
import { useLogout } from '../api/use-logout';

export type SignOutState = {
	signOut: () => void;
	isSigningOut: boolean;
};

/**
 * Signs the user out and replaces the current page with `/login` (without `redirect`, so the next person at a shared device does not land on this page).
 *
 * A failure other than a lost session shows the server message as a toast and keeps the user on the page.
 */
export function useSignOut(): SignOutState {
	const navigate = useNavigate();
	const router = useRouter();
	const logout = useLogout();

	function signOut(): void {
		logout.mutate(undefined, {
			onSuccess: () => {
				router.clearCache();
				return navigate({ to: '/login', replace: true });
			},
			onError: (error) => toast.error(getErrorMessage(error)),
		});
	}

	return { signOut, isSigningOut: logout.isPending };
}
