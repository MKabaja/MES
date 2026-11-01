import { z } from 'zod';
import { ensureCsrfCookie, http } from '@/shared/api/http';
import { userResponseSchema } from '../model/auth.schemas';
import type { LoginCredentials, User } from '../model/auth.types';

/**
 * Signs in and returns the user; fetches the CSRF cookie first.
 *
 * @throws `HttpError` with `INVALID_CREDENTIALS`, `ACCOUNT_INACTIVE`, `NETWORK_NOT_ALLOWED` or `429`.
 */
export async function login(credentials: LoginCredentials): Promise<User> {
	await ensureCsrfCookie();
	const response = await http('/auth/login', {
		method: 'POST',
		body: credentials,
		schema: userResponseSchema,
	});
	return response.data;
}

/**
 * Ends the server session.
 *
 * @throws `HttpError` with status `401` when there is no session left.
 */
export async function logout(): Promise<void> {
	await http('/auth/logout', { method: 'POST', schema: z.undefined() });
}

/**
 * Fetches the signed-in user.
 *
 * @throws `HttpError` with status `401` when there is no session.
 */
export async function fetchMe({
	signal,
}: {
	signal?: AbortSignal;
} = {}): Promise<User> {
	const response = await http('/auth/me', {
		schema: userResponseSchema,
		...(signal && { signal }),
	});
	return response.data;
}
