import { act, screen, waitFor } from '@testing-library/react';
import { delay, HttpResponse, http as mswHttp } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { authQueries } from '@/features/auth/api/auth.queries';
import type { Role } from '@/features/auth/model/auth.types';
import { http } from '@/shared/api/http';
import { readSessionStorage, writeSessionStorage } from '@/shared/lib/storage';
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

function sendOrdersRequests(
	{ queryClient }: RenderWithProvidersResult,
	concurrentRequests: number,
) {
	const requests = Array.from({ length: concurrentRequests }, (_, index) =>
		queryClient
			.fetchQuery({
				queryKey: ['orders', index],
				queryFn: () => http('/orders', { schema: z.unknown() }),
			})
			.catch(() => undefined),
	);
	return Promise.all(requests);
}

async function requestFromApp(
	rendered: RenderWithProvidersResult,
	concurrentRequests = 1,
) {
	await act(async () => {
		await sendOrdersRequests(rendered, concurrentRequests);
	});
}

function createGate() {
	let open = () => {};
	const promise = new Promise<void>((resolve) => {
		open = resolve;
	});
	return { promise, open };
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

function waitForRouteLoad(router: RenderWithProvidersResult['router']) {
	return new Promise<void>((resolve) => {
		const unsubscribe = router.subscribe('onResolved', () => {
			unsubscribe();
			resolve();
		});
	});
}

describe('session check failing', () => {
	it.each([
		{
			reason: 'a server error',
			response: () => errorResponse(500, 'SERVER_ERROR', 'Błąd serwera.'),
		},
		{ reason: 'no connection', response: () => HttpResponse.error() },
	])(
		'shows the route error with a working retry on $reason',
		async ({ response }) => {
			server.use(mswHttp.get('*/api/v1/auth/me', response, { once: true }));
			const { user, router } = await renderWithProviders(undefined, {
				route: '/hala',
			});
			const retryButton = screen.getByRole('button', {
				name: 'Spróbuj ponownie',
			});
			const reloaded = waitForRouteLoad(router);

			await user.click(retryButton);
			await act(() => reloaded);

			expect(screen.getByRole('heading', { name: 'Hala' })).toBeInTheDocument();
		},
	);
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
		const logoutRequests = vi.fn();
		server.use(
			mswHttp.get('*/api/v1/auth/me', () =>
				errorResponse(403, 'ACCOUNT_INACTIVE', 'Konto jest nieaktywne.'),
			),
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);

		const { router } = await renderWithProviders(undefined, {
			route: '/panel',
		});

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Konto jest nieaktywne.',
		);
		expect(router.state.location.pathname).toBe('/login');
		await waitFor(() => expect(logoutRequests).toHaveBeenCalledTimes(1));
	});
});

describe('session rejected in several requests at once', () => {
	it('signs out only once', async () => {
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

		await requestFromApp(rendered, 2);

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Dostęp z tej sieci jest niedozwolony.',
		);
		expect(logoutRequests).toHaveBeenCalledTimes(1);
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

	it('ignores a rejection that arrives after the session has already ended', async () => {
		signInAs('worker');
		const logoutRequests = vi.fn();
		const lateRejection = createGate();
		const sessionCheck = createGate();
		let ordersRequestCount = 0;
		server.use(
			mswHttp.get('*/api/v1/orders', async () => {
				ordersRequestCount += 1;
				if (ordersRequestCount > 1) {
					await lateRejection.promise;
				}
				return errorResponse(
					403,
					'NETWORK_NOT_ALLOWED',
					'Dostęp z tej sieci jest niedozwolony.',
				);
			}),
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		const ordersRequests = sendOrdersRequests(rendered, 2);
		await screen.findByText('Dostęp z tej sieci jest niedozwolony.');
		server.use(
			mswHttp.get('*/api/v1/auth/me', async () => {
				await sessionCheck.promise;
				return errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.');
			}),
		);

		act(() => rendered.router.history.push('/hala'));
		await waitFor(() =>
			expect(rendered.router.state.location.pathname).toBe('/hala'),
		);
		lateRejection.open();
		await act(() => ordersRequests);
		sessionCheck.open();

		await waitFor(() =>
			expect(rendered.router.state.location.search).toEqual({
				redirect: '/hala',
			}),
		);
		expect(logoutRequests).toHaveBeenCalledTimes(1);
	});

	it('signs out again when the next session is rejected after signing in', async () => {
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
		await screen.findByText('Dostęp z tej sieci jest niedozwolony.');
		await rendered.user.type(screen.getByLabelText('Login'), 'Jkowal');
		await rendered.user.type(screen.getByLabelText('Hasło'), '1234');
		await rendered.user.click(
			screen.getByRole('button', { name: 'Zaloguj się' }),
		);
		await screen.findByRole('heading', { name: 'Hala' });

		await requestFromApp(rendered);

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Dostęp z tej sieci jest niedozwolony.',
		);
		expect(rendered.router.state.location.pathname).toBe('/login');
		expect(logoutRequests).toHaveBeenCalledTimes(2);
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
	it('blocks the logout button while the request is running and keeps it focused', async () => {
		signInAs('worker');
		const logoutRequests = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/auth/logout', async () => {
				logoutRequests();
				await delay(150);
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const { user } = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		const logoutButton = screen.getByRole('button', { name: 'Wyloguj' });

		await user.click(logoutButton);
		await user.click(logoutButton);

		expect(logoutButton).toHaveAttribute('aria-disabled', 'true');
		expect(logoutButton).toHaveFocus();
		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(logoutRequests).toHaveBeenCalledTimes(1);
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
		expect(screen.getByRole('button', { name: 'Wyloguj' })).not.toHaveAttribute(
			'aria-disabled',
			'true',
		);
	});
});

describe('logout waiting for the server', () => {
	function goOnline() {
		act(() => {
			window.dispatchEvent(new Event('online'));
		});
	}

	function failLogoutOnceWithoutNetwork() {
		const logoutRequests = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutRequests();
				return logoutRequests.mock.calls.length === 1
					? HttpResponse.error()
					: new HttpResponse(null, { status: 204 });
			}),
		);
		return logoutRequests;
	}

	async function signOutWithoutNetwork() {
		signInAs('worker');
		const logoutRequests = failLogoutOnceWithoutNetwork();
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		rendered.queryClient.setQueryData(['hall', 'orders'], [{ id: 1 }]);
		await rendered.user.click(screen.getByRole('button', { name: 'Wyloguj' }));
		await screen.findByText('Wylogowywanie…');
		return { ...rendered, logoutRequests };
	}

	it('hides the data behind a signing-out screen while there is no network', async () => {
		const { queryClient } = await signOutWithoutNetwork();

		expect(screen.getByRole('status')).toHaveTextContent(
			'Brak połączenia. Ponawiamy próbę.',
		);
		expect(screen.queryByRole('heading', { name: 'Hala' })).toBeNull();
		expect(screen.queryByText('Jan Kowalski')).toBeNull();
		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
	});

	it('finishes the logout as soon as the network comes back', async () => {
		const { router, logoutRequests } = await signOutWithoutNetwork();

		goOnline();

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(router.state.location.search).toEqual({});
		expect(logoutRequests).toHaveBeenCalledTimes(2);
		expect(screen.queryByText('Wylogowywanie…')).toBeNull();
	});

	it('retries the logout after 30 seconds', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const { logoutRequests } = await signOutWithoutNetwork();

		await act(() => vi.advanceTimersByTimeAsync(29_000));
		expect(logoutRequests).toHaveBeenCalledTimes(1);

		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(logoutRequests).toHaveBeenCalledTimes(2);
	});

	it('keeps the signing-out screen and skips the session check on navigation', async () => {
		const rendered = await signOutWithoutNetwork();
		const meRequests = vi.fn();
		server.use(
			mswHttp.get('*/api/v1/auth/me', () => {
				meRequests();
				return HttpResponse.json({ data: buildUser() });
			}),
		);

		await act(() => rendered.router.navigate({ to: '/hala' }));
		act(() => rendered.router.history.back());

		expect(screen.getByText('Wylogowywanie…')).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Hala' })).toBeNull();
		expect(meRequests).not.toHaveBeenCalled();
	});

	it('leaves to login when the retried logout answers 401', async () => {
		await signOutWithoutNetwork();
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () =>
				errorResponse(401, 'UNAUTHENTICATED', 'Brak aktywnej sesji.'),
			),
		);

		goOnline();

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
	});

	it('never sends two logout requests at once', async () => {
		signInAs('worker');
		const secondAttempt = createGate();
		let logoutAttempts = 0;
		let runningLogouts = 0;
		let mostRunningLogouts = 0;
		server.use(
			mswHttp.post('*/api/v1/auth/logout', async () => {
				logoutAttempts += 1;
				runningLogouts += 1;
				mostRunningLogouts = Math.max(mostRunningLogouts, runningLogouts);
				if (logoutAttempts === 2) {
					await secondAttempt.promise;
				}
				runningLogouts -= 1;
				return logoutAttempts === 3
					? new HttpResponse(null, { status: 204 })
					: HttpResponse.error();
			}),
		);
		const { user } = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));
		await screen.findByText('Wylogowywanie…');

		goOnline();
		goOnline();
		goOnline();
		secondAttempt.open();

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(mostRunningLogouts).toBe(1);
		expect(logoutAttempts).toBe(3);
	});

	it('hides the data of a rejected session before the slow logout finishes', async () => {
		signInAs('worker');
		const logoutResponse = createGate();
		server.use(
			mswHttp.get('*/api/v1/orders', () =>
				errorResponse(
					403,
					'NETWORK_NOT_ALLOWED',
					'Dostęp z tej sieci jest niedozwolony.',
				),
			),
			mswHttp.post('*/api/v1/auth/logout', async () => {
				await logoutResponse.promise;
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const rendered = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });

		await requestFromApp(rendered);

		expect(screen.getByText('Wylogowywanie…')).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Hala' })).toBeNull();
		expect(rendered.queryClient.getQueryCache().getAll()).toHaveLength(0);

		logoutResponse.open();

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Dostęp z tej sieci jest niedozwolony.',
		);
	});
});

describe('logout pending across a reload', () => {
	function recordSessionRequests() {
		const sessionRequests: string[] = [];
		const logoutResponse = createGate();
		server.use(
			mswHttp.get('*/api/v1/auth/me', () => {
				sessionRequests.push('me');
				return HttpResponse.json({ data: buildUser() });
			}),
			mswHttp.post('*/api/v1/auth/logout', async () => {
				sessionRequests.push('logout');
				await logoutResponse.promise;
				return new HttpResponse(null, { status: 204 });
			}),
		);
		return { sessionRequests, logoutResponse };
	}

	it('remembers the pending logout for this tab and forgets it once the server confirms', async () => {
		signInAs('worker');
		const { logoutResponse } = recordSessionRequests();
		const { user } = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () => HttpResponse.error(), {
				once: true,
			}),
		);
		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));
		await screen.findByText('Wylogowywanie…');
		expect(readSessionStorage('mes.pendingLogout')).toBe(true);

		act(() => {
			window.dispatchEvent(new Event('online'));
		});
		logoutResponse.open();

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(readSessionStorage('mes.pendingLogout')).toBe(false);
	});

	it('finishes the logout after a reload before checking the session', async () => {
		writeSessionStorage('mes.pendingLogout', true);
		const { sessionRequests, logoutResponse } = recordSessionRequests();

		const { router } = await renderWithProviders(undefined, {
			route: '/hala',
		});

		expect(screen.getByText('Wylogowywanie…')).toBeInTheDocument();
		await waitFor(() => expect(sessionRequests).toEqual(['logout']));

		logoutResponse.open();

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/login');
		expect(sessionRequests).toEqual(['logout']);
		expect(readSessionStorage('mes.pendingLogout')).toBe(false);
	});

	it('keeps retrying the resumed logout until the network comes back', async () => {
		writeSessionStorage('mes.pendingLogout', true);
		let logoutAttempts = 0;
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutAttempts += 1;
				return logoutAttempts === 1
					? HttpResponse.error()
					: new HttpResponse(null, { status: 204 });
			}),
		);
		await renderWithProviders(undefined, { route: '/hala' });
		expect(
			await screen.findByText('Brak połączenia. Ponawiamy próbę.'),
		).toBeInTheDocument();
		expect(readSessionStorage('mes.pendingLogout')).toBe(true);

		act(() => {
			window.dispatchEvent(new Event('online'));
		});

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(logoutAttempts).toBe(2);
	});
});

describe('session change', () => {
	it('drops toasts of the session on logout', async () => {
		signInAs('worker');
		const { user } = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		act(() => {
			toast.error('Komunikat poprzedniej sesji');
		});
		await screen.findByText('Komunikat poprzedniej sesji');

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		await screen.findByRole('heading', { name: 'Zaloguj się' });
		await waitFor(() =>
			expect(screen.queryByText('Komunikat poprzedniej sesji')).toBeNull(),
		);
	});

	it('drops toasts and the router cache on sign-in', async () => {
		signOutOnServer();
		const { user, router } = await renderWithProviders(undefined, {
			route: '/login',
		});
		const clearRouterCache = vi.spyOn(router, 'clearCache');
		act(() => {
			toast.error('Komunikat sprzed logowania');
		});
		await screen.findByText('Komunikat sprzed logowania');

		await user.type(screen.getByLabelText('Login'), 'Jkowal');
		await user.type(screen.getByLabelText('Hasło'), '1234');
		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		await screen.findByRole('heading', { name: 'Hala' });
		expect(clearRouterCache).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(screen.queryByText('Komunikat sprzed logowania')).toBeNull(),
		);
	});
});

describe('manual logout answered with a session rejection', () => {
	it('signs out with the server message and without a toast', async () => {
		signInAs('worker');
		let logoutAttempts = 0;
		server.use(
			mswHttp.post('*/api/v1/auth/logout', () => {
				logoutAttempts += 1;
				return logoutAttempts === 1
					? errorResponse(403, 'ACCOUNT_INACTIVE', 'Konto jest nieaktywne.')
					: new HttpResponse(null, { status: 204 });
			}),
		);
		const { user } = await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));
		await screen.findByText('Wylogowywanie…');
		act(() => {
			window.dispatchEvent(new Event('online'));
		});

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Konto jest nieaktywne.',
		);
		expect(screen.getAllByText('Konto jest nieaktywne.')).toHaveLength(1);
	});
});
