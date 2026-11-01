import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import type { HttpError } from '@/shared/api/http-error';
import type { LoginCredentials, User } from '../model/auth.types';
import { announceSignedIn } from '../utils/session-sync';
import { login } from './auth.api';
import { authQueries } from './auth.queries';

export type UseLoginResult = UseMutationResult<
	User,
	HttpError,
	LoginCredentials
>;

/**
 * Mutation that signs in, stores the returned user as the `me` query data and tells other tabs who signed in.
 *
 * Navigation and messages belong to the caller (`mutate(vars, { onSuccess })`).
 */
export function useLogin(): UseLoginResult {
	const queryClient = useQueryClient();
	return useMutation<User, HttpError, LoginCredentials>({
		mutationFn: login,
		onSuccess: (user) => {
			queryClient.clear();
			queryClient.setQueryData(authQueries.me().queryKey, user);
			announceSignedIn(user.id);
		},
	});
}
