import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import type { HttpError } from '@/shared/api/http-error';
import type { LoginCredentials, User } from '../model/auth.types';
import { login } from './auth.api';
import { authQueries } from './auth.queries';

export type UseLoginResult = UseMutationResult<
	User,
	HttpError,
	LoginCredentials
>;

/**
 * Mutation that signs in and stores the returned user as the `me` query data.
 *
 * Navigation and messages belong to the caller (`mutate(vars, { onSuccess })`).
 */
export function useLogin(): UseLoginResult {
	const queryClient = useQueryClient();
	return useMutation<User, HttpError, LoginCredentials>({
		mutationFn: login,
		onSuccess: (user) => {
			queryClient.setQueryData(authQueries.me().queryKey, user);
		},
	});
}
