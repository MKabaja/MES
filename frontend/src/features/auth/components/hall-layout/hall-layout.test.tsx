import { act, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeStorage } from '@/shared/lib/storage';
import { buildPublicSettings } from '@/test/fixtures/settings';
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

describe('HallLayout on a station', () => {
	it('signs out an idle station and retries until the logout succeeds', async () => {
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
		expect(screen.queryByRole('heading', { name: 'Zaloguj się' })).toBeNull();

		await act(() => vi.advanceTimersByTimeAsync(30_000));

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
		expect(logoutAttempts).toBe(2);
	});
});
