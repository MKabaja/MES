import { act, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeStorage } from '@/shared/lib/storage';
import { buildPublicSettings } from '@/test/fixtures/settings';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	writeStorage('mes.stationMode', true);
	server.use(
		http.get('*/api/v1/settings/public', () =>
			HttpResponse.json({
				data: buildPublicSettings({ station_idle_logout_minutes: 1 }),
			}),
		),
	);
});

afterEach(() => {
	writeStorage('mes.stationMode', false);
});

describe('SessionIdleLogout on a station', () => {
	it('hides the idle station behind the signing-out screen and retries until the logout succeeds', async () => {
		let logoutAttempts = 0;
		server.use(
			http.post('*/api/v1/auth/logout', () => {
				logoutAttempts += 1;
				return new HttpResponse(null, {
					status: logoutAttempts === 1 ? 500 : 204,
				});
			}),
		);
		await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });

		await act(() => vi.advanceTimersByTimeAsync(60_000));
		expect(logoutAttempts).toBe(1);
		expect(screen.getByText('Wylogowywanie…')).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Hala' })).toBeNull();

		await act(() => vi.advanceTimersByTimeAsync(30_000));

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(logoutAttempts).toBe(2);
	});

	it('warns and signs out an idle admin', async () => {
		const logoutRequests = vi.fn();
		server.use(
			http.get('*/api/v1/auth/me', () =>
				HttpResponse.json({ data: buildUser({ role: 'admin' }) }),
			),
			http.post('*/api/v1/auth/logout', () => {
				logoutRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);
		await renderWithProviders(undefined, { route: '/panel' });
		await screen.findByRole('heading', { name: 'Panel' });

		await act(() => vi.advanceTimersByTimeAsync(30_000));
		expect(
			await screen.findByRole('alertdialog', { name: /bezczynność/i }),
		).toBeInTheDocument();

		await act(() => vi.advanceTimersByTimeAsync(30_000));

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(logoutRequests).toHaveBeenCalledTimes(1);
	});

	it.each([
		{ page: 'the login page', path: '/login', heading: 'Zaloguj się' },
		{
			page: 'an unknown path',
			path: '/nie-ma-takiej-strony',
			heading: 'Nie znaleziono strony',
		},
	])(
		'signs out an idle signed-in station on $page',
		async ({ path, heading }) => {
			const logoutRequests = recordLogoutRequests();
			const { router } = await renderWithProviders(undefined, {
				route: '/hala',
			});
			await screen.findByRole('heading', { name: 'Hala' });

			act(() => router.history.push(path));
			await screen.findByRole('heading', { name: heading });
			await act(() => vi.advanceTimersByTimeAsync(30_000));
			expect(
				await screen.findByRole('alertdialog', { name: /bezczynność/i }),
			).toBeInTheDocument();
			await act(() => vi.advanceTimersByTimeAsync(30_000));

			await waitFor(() => expect(logoutRequests).toHaveBeenCalledTimes(1));
			expect(
				await screen.findByRole('heading', { name: 'Zaloguj się' }),
			).toBeInTheDocument();
		},
	);

	it('signs out an idle station that opens the login page with a live session', async () => {
		const logoutRequests = recordLogoutRequests();
		await renderWithProviders(undefined, { route: '/login' });
		await screen.findByRole('heading', { name: 'Zaloguj się' });

		await act(() => vi.advanceTimersByTimeAsync(30_000));
		expect(
			await screen.findByRole('alertdialog', { name: /bezczynność/i }),
		).toBeInTheDocument();
		await act(() => vi.advanceTimersByTimeAsync(30_000));

		await waitFor(() => expect(logoutRequests).toHaveBeenCalledTimes(1));
	});

	it('leaves a guest station on the login page without further requests', async () => {
		const meRequests = vi.fn();
		const logoutRequests = recordLogoutRequests();
		server.use(
			http.get('*/api/v1/auth/me', () => {
				meRequests();
				return HttpResponse.json(
					{ message: 'Brak aktywnej sesji.', code: 'UNAUTHENTICATED' },
					{ status: 401 },
				);
			}),
		);
		const { router } = await renderWithProviders(undefined, {
			route: '/login',
		});
		await screen.findByRole('heading', { name: 'Zaloguj się' });

		await act(() => vi.advanceTimersByTimeAsync(5 * 60_000));

		expect(router.state.location.href).toBe('/login');
		expect(meRequests).toHaveBeenCalledTimes(1);
		expect(logoutRequests).not.toHaveBeenCalled();
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('does not check the session while the logout waits for the server', async () => {
		server.use(
			http.post(
				'*/api/v1/auth/logout',
				() => new HttpResponse(null, { status: 500 }),
			),
		);
		await renderWithProviders(undefined, { route: '/hala' });
		await screen.findByRole('heading', { name: 'Hala' });
		const meRequests = vi.fn();
		server.use(
			http.get('*/api/v1/auth/me', () => {
				meRequests();
				return HttpResponse.json({ data: buildUser() });
			}),
		);

		await act(() => vi.advanceTimersByTimeAsync(60_000));
		expect(screen.getByText('Wylogowywanie…')).toBeInTheDocument();
		await act(() => vi.advanceTimersByTimeAsync(60_000));

		expect(meRequests).not.toHaveBeenCalled();
	});
});

function recordLogoutRequests() {
	const logoutRequests = vi.fn();
	server.use(
		http.post('*/api/v1/auth/logout', () => {
			logoutRequests();
			return new HttpResponse(null, { status: 204 });
		}),
	);
	return logoutRequests;
}
