import { QueryClient } from '@tanstack/react-query';
import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { HttpError, INVALID_RESPONSE_CODE } from '@/shared/api/http-error';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { authQueries } from './auth.queries';

function createClient(): QueryClient {
	return new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
}

describe('authQueries.me', () => {
	it('resolves to the signed-in user', async () => {
		const worker = buildUser({ role: 'worker' });
		server.use(
			mswHttp.get('*/api/v1/auth/me', () =>
				HttpResponse.json({ data: worker }),
			),
		);

		const result = await createClient().fetchQuery(authQueries.me());

		expect(result).toEqual(worker);
	});

	it('resolves to null without a session instead of failing', async () => {
		server.use(
			mswHttp.get('*/api/v1/auth/me', () =>
				HttpResponse.json(
					{ message: 'Brak sesji.', code: 'UNAUTHENTICATED' },
					{ status: 401 },
				),
			),
		);

		const result = await createClient().fetchQuery(authQueries.me());

		expect(result).toBeNull();
	});

	it('still fails on server errors', async () => {
		server.use(
			mswHttp.get('*/api/v1/auth/me', () =>
				HttpResponse.json(
					{ message: 'Błąd serwera.', code: 'SERVER_ERROR' },
					{ status: 500 },
				),
			),
		);

		const failure = createClient().fetchQuery(authQueries.me());

		await expect(failure).rejects.toMatchObject({
			status: 500,
			code: 'SERVER_ERROR',
		});
	});

	it('rejects a user payload that breaks the contract', async () => {
		server.use(
			mswHttp.get('*/api/v1/auth/me', () =>
				HttpResponse.json({ data: { id: 12, role: 'worker' } }),
			),
		);

		const failure = createClient().fetchQuery(authQueries.me());

		await expect(failure).rejects.toBeInstanceOf(HttpError);
		await expect(failure).rejects.toMatchObject({
			code: INVALID_RESPONSE_CODE,
		});
	});

	it('is fetched once and then served from the cache', async () => {
		const meRequests = vi.fn();
		server.use(
			mswHttp.get('*/api/v1/auth/me', () => {
				meRequests();
				return HttpResponse.json({ data: buildUser() });
			}),
		);
		const client = createClient();

		await client.fetchQuery(authQueries.me());
		await client.fetchQuery(authQueries.me());

		expect(meRequests).toHaveBeenCalledTimes(1);
	});
});
