import { QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	hasLoadedCsrfCookie,
	markCsrfCookieLoaded,
	resetCsrfCookie,
} from '@/shared/api/csrf';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { renderHookWithClient } from '@/test/render-hook';
import { authQueries } from './auth.queries';
import { useLogout } from './use-logout';

beforeEach(() => {
	resetCsrfCookie();
	markCsrfCookieLoaded();
});

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	queryClient.setQueryData(authQueries.me().queryKey, buildUser());
	queryClient.setQueryData(['orders'], [{ id: 1 }]);
	const csrfRequests = vi.fn();
	server.use(
		mswHttp.get('*/sanctum/csrf-cookie', () => {
			csrfRequests();
			return new HttpResponse(null, { status: 204 });
		}),
	);
	const hook = renderHookWithClient(() => useLogout(), queryClient);
	return { csrfRequests, ...hook };
}

describe('useLogout', () => {
	it('clears the whole cache and refreshes the CSRF cookie', async () => {
		const { result, queryClient, csrfRequests } = setup();

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
		expect(csrfRequests).toHaveBeenCalledTimes(1);
	});

	it('treats 401 as already signed out', async () => {
		const { result, queryClient, csrfRequests } = setup();
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () =>
				HttpResponse.json(
					{ message: 'Brak sesji.', code: 'UNAUTHENTICATED' },
					{ status: 401 },
				),
			),
		);

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
		expect(csrfRequests).toHaveBeenCalledTimes(1);
	});

	it('treats a network failure as signed out', async () => {
		const { result, queryClient, csrfRequests } = setup();
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () => HttpResponse.error()),
		);

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
		expect(csrfRequests).toHaveBeenCalledTimes(1);
	});

	it('keeps the cache and reports other errors', async () => {
		const { result, queryClient, csrfRequests } = setup();
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () =>
				HttpResponse.json(
					{ message: 'Błąd serwera.', code: 'SERVER_ERROR' },
					{ status: 500 },
				),
			),
		);

		result.current.mutate();

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(queryClient.getQueryData(authQueries.me().queryKey)).toEqual(
			buildUser(),
		);
		expect(csrfRequests).not.toHaveBeenCalled();
	});

	it('still signs out when refreshing the CSRF cookie fails', async () => {
		const { result, queryClient } = setup();
		server.use(
			mswHttp.get('*/sanctum/csrf-cookie', () => HttpResponse.error()),
		);

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
		expect(hasLoadedCsrfCookie()).toBe(false);
	});
});
