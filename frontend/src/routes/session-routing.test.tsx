import { act, screen, waitFor } from '@testing-library/react';
import { delay, HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { authQueries } from '@/features/auth/api/auth.queries';
import type { Role } from '@/features/auth/model/auth.types';
import { http } from '@/shared/api/http';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import {
	type RenderWithProvidersResult,
	renderWithProviders,
} from '@/test/render';

function signInAs(role: Role) {
	server.use(
		mswHttp.get('*/api/v1/auth/me', () =>
			HttpResponse.json({ data: buildUser({ role }) }),
		),
	);
}

function errorResponse(status: number, code: string, message: string) {
	return HttpResponse.json({ message, code }, { status });
}

function signOutOnServer() {
	const meRequests = vi.fn();
	server.use(
		mswHttp.get('*/api/v1/auth/me', () => {
			meRequests();
			return errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.');
		}),
	);
	return meRequests;
}

async function requestFromApp(
	{ queryClient }: RenderWithProvidersResult,
	concurrentRequests = 1,
) {
	const requests = Array.from({ length: concurrentRequests }, (_, index) =>
		queryClient
			.fetchQuery({
				queryKey: ['orders', index],
				queryFn: () => http('/orders', { schema: z.unknown() }),
			})
			.catch(() => undefined),
	);
	await act(async () => {
		await Promise.all(requests);
	});
}

describe('guest', () => {
	it('is sent to the login screen with the requested page in redirect', async () => {
		const meRequests = signOutOnServer();

		const { router } = await renderWithProviders(undefined, {
			route: '/panel?tab=a',
		});

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/login');
		expect(router.state.location.search).toEqual({ redirect: '/panel?tab=a' });
		expect(meRequests).toHaveBeenCalledTimes(1);
	});

	it('is sent from / to the login screen without redirect', async () => {
		signOutOnServer();

		const { router } = await renderWithProviders(undefined, { route: '/' });

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(router.state.location.search).toEqual({});
	});

	it('stays on the login screen when another request returns 401', async () => {
		signOutOnServer();
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.'),
			),
		);
		const rendered = await renderWithProviders(undefined, { route: '/login' });

		await requestFromApp(rendered);

		expect(rendered.router.state.location.pathname).toBe('/login');
		expect(rendered.router.state.location.search).toEqual({});
	});
});

describe('role guards', () => {
	it('sends a worker from /panel to the hall', async () => {
		signInAs('worker');

		const { router } = await renderWithProviders(undefined, {
			route: '/panel',
		});

		expect(
			await screen.findByRole('heading', { name: 'Hala' }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/hala');
	});

	it('sends an admin from /hala to the panel', async () => {
		signInAs('admin');

		const { router } = await renderWithProviders(undefined, { route: '/hala' });

		expect(
			await screen.findByRole('heading', { name: 'Panel' }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/panel');
	});

	it('sends / to the panel for an admin', async () => {
		signInAs('admin');

		const { router } = await renderWithProviders(undefined, { route: '/' });

		expect(
			await screen.findByRole('heading', { name: 'Panel' }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/panel');
	});

	it('sends / to the hall for a worker', async () => {
		signInAs('worker');

		const { router } = await renderWithProviders(undefined, { route: '/' });

		expect(
			await screen.findByRole('heading', { name: 'Hala' }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/hala');
	});

	it('shows the signed-in user in the layout', async () => {
		signInAs('worker');

		await renderWithProviders(undefined, { route: '/hala' });

		expect(await screen.findByText('Jan Kowalski')).toBeInTheDocument();
	});
});

describe('session lost during work', () => {
	it('clears the cache and goes to login with the current page in redirect after a 401', async () => {
		signInAs('worker');
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.'),
			),
		);
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });

		await requestFromApp(rendered);

		await waitFor(() =>
			expect(rendered.router.state.location.pathname).toBe('/login'),
		);
		expect(rendered.router.state.location.search).toEqual({
			redirect: '/hala',
		});
		expect(
			rendered.queryClient.getQueryData(authQueries.me().queryKey),
		).toBeUndefined();
		expect(rendered.queryClient.getQueryData(['orders'])).toBeUndefined();
	});

	it('keeps the search params of the current page in redirect after a 401', async () => {
		signInAs('worker');
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.'),
			),
		);
		const rendered = await renderWithProviders(undefined, {
			route: '/hala?x=1',
		});
		await screen.findByRole('heading', { name: 'Hala' });

		await requestFromApp(rendered);

		await waitFor(() =>
			expect(rendered.router.state.location.search).toEqual({
				redirect: '/hala?x=1',
			}),
		);
	});

	it('signs out and shows the server message when the network is not allowed', async () => {
		signInAs('worker');
		const logoutRequests = vi.fn();
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(
					403,
					'NETWORK_NOT_ALLOWED',
					'Dostęp z tej sieci jest niedozwolony.',
				),
			),
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });

		await requestFromApp(rendered);

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Dostęp z tej sieci jest niedozwolony.',
		);
		expect(logoutRequests).toHaveBeenCalledTimes(1);
		expect(rendered.router.state.location.pathname).toBe('/login');
		expect(rendered.router.state.location.search).toEqual({});
		expect(rendered.queryClient.getQueryCache().getAll()).toHaveLength(0);
	});

	it('shows the server message when the session check itself is rejected', async () => {
		server.use(
			mswHttp.get('*/api/v1/auth/me', () =>
				errorResponse(403, 'ACCOUNT_INACTIVE', 'Konto jest nieaktywne.'),
			),
		);

		const { router } = await renderWithProviders(undefined, {
			route: '/panel',
		});

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Konto jest nieaktywne.',
		);
		expect(router.state.location.pathname).toBe('/login');
	});
});

describe('session rejected in several requests at once', () => {
	it('signs out and navigates only once', async () => {
		signInAs('worker');
		const logoutRequests = vi.fn();
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(
					403,
					'NETWORK_NOT_ALLOWED',
					'Dostęp z tej sieci jest niedozwolony.',
				),
			),
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		const navigate = vi.spyOn(rendered.router, 'navigate');

		await requestFromApp(rendered, 2);

		await screen.findByRole('alert');
		expect(logoutRequests).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it('shows only the new login error after the next attempt', async () => {
		signInAs('worker');
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(
					403,
					'NETWORK_NOT_ALLOWED',
					'Dostęp z tej sieci jest niedozwolony.',
				),
			),
			mswHttp.post('*/api/v1/auth/login', () =>
				errorResponse(
					422,
					'INVALID_CREDENTIALS',
					'Nieprawidłowy login lub hasło.',
				),
			),
		);
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		await requestFromApp(rendered);
		await screen.findByText('Dostęp z tej sieci jest niedozwolony.');

		await rendered.user.type(screen.getByLabelText('Login'), 'Jkowal');
		await rendered.user.type(screen.getByLabelText('Hasło'), '1234');
		await rendered.user.click(
			screen.getByRole('button', { name: 'Zaloguj się' }),
		);

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Nieprawidłowy login lub hasło.',
		);
		expect(screen.getAllByRole('alert')).toHaveLength(1);
	});
});

describe('session check dropped from the cache', () => {
	it('removes the previous user data when the next navigation finds no session', async () => {
		signInAs('worker');
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		rendered.queryClient.setQueryData(['hall', 'orders'], [{ id: 1 }]);
		rendered.queryClient.removeQueries({ queryKey: authQueries.me().queryKey });
		signOutOnServer();

		await act(() => rendered.router.navigate({ to: '/panel' }));

		await waitFor(() =>
			expect(rendered.router.state.location.pathname).toBe('/login'),
		);
		expect(
			rendered.queryClient.getQueryData(['hall', 'orders']),
		).toBeUndefined();
	});
});

describe('logout', () => {
	it('disables the logout button while the request is running', async () => {
		signInAs('worker');
		server.use(
			mswHttp.post('*/api/v1/auth/logout', async () => {
				await delay(150);
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const { user } = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		expect(screen.getByRole('button', { name: 'Wyloguj' })).toBeDisabled();
		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
	});

	it('clears the cache and lands on login without redirect', async () => {
		signInAs('worker');
		const { user, router, queryClient } = await renderWithProviders(undefined, {
			route: '/hala',
		});
		await screen.findByRole('heading', { name: 'Hala' });
		queryClient.setQueryData(['orders'], [{ id: 1 }]);

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(router.state.location.search).toEqual({});
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
	});

	it('lands on login without redirect even when logout answers 401', async () => {
		signInAs('admin');
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () =>
				errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.'),
			),
		);
		const { user, router } = await renderWithProviders(undefined, {
			route: '/panel',
		});
		await screen.findByRole('heading', { name: 'Panel' });

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(router.state.location.search).toEqual({});
	});

	it('stays on the page and shows a toast when logout fails', async () => {
		signInAs('worker');
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () =>
				errorResponse(500, 'SERVER_ERROR', 'Wystąpił błąd serwera.'),
			),
		);
		const { user, router } = await renderWithProviders(undefined, {
			route: '/hala',
		});
		await screen.findByRole('heading', { name: 'Hala' });

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		expect(
			await screen.findByText('Wystąpił błąd serwera.'),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/hala');
		expect(screen.getByRole('button', { name: 'Wyloguj' })).toBeEnabled();
	});
});
