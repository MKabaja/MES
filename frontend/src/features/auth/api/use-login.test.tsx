import { waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetCsrfCookie } from '@/shared/api/csrf';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { renderHookWithClient } from '@/test/render-hook';
import { authQueries } from './auth.queries';
import { useLogin } from './use-login';

beforeEach(() => {
	resetCsrfCookie();
});

function setup() {
	return renderHookWithClient(() => useLogin());
}

describe('useLogin', () => {
	it('sends the credentials after fetching the CSRF cookie and stores the user as me', async () => {
		const admin = buildUser({ role: 'admin', login: 'Anowak' });
		const calls: string[] = [];
		let sentBody: unknown;
		server.use(
			mswHttp.get('*/sanctum/csrf-cookie', () => {
				calls.push('csrf');
				return new HttpResponse(null, { status: 204 });
			}),
			mswHttp.post('*/api/v1/auth/login', async ({ request }) => {
				calls.push('login');
				sentBody = await request.json();
				return HttpResponse.json({ data: admin });
			}),
		);
		const { result, queryClient } = setup();

		result.current.mutate({ login: 'Anowak', password: '1234' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(calls).toEqual(['csrf', 'login']);
		expect(sentBody).toEqual({ login: 'Anowak', password: '1234' });
		expect(queryClient.getQueryData(authQueries.me().queryKey)).toEqual(admin);
	});

	it('leaves me untouched when the credentials are rejected', async () => {
		server.use(
			mswHttp.post('*/api/v1/auth/login', () =>
				HttpResponse.json(
					{
						message: 'Nieprawidłowy login lub hasło',
						code: 'INVALID_CREDENTIALS',
					},
					{ status: 422 },
				),
			),
		);
		const { result, queryClient } = setup();

		result.current.mutate({ login: 'Jkowal', password: 'zle' });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.code).toBe('INVALID_CREDENTIALS');
		expect(queryClient.getQueryData(authQueries.me().queryKey)).toBeUndefined();
	});
});
