import { act, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '@/shared/config/app.config';
import { writeStorage } from '@/shared/lib/storage';
import { buildPublicSettings } from '@/test/fixtures/settings';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { StationIdleLogout } from './station-idle-logout';

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
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

async function setup({ isStation = true } = {}) {
	writeStorage('mes.stationMode', isStation);
	const onTimeout = vi.fn();
	const view = await renderWithProviders(
		<StationIdleLogout onTimeout={onTimeout} />,
	);
	return { onTimeout, ...view };
}

function advance(milliseconds: number) {
	return act(() => vi.advanceTimersByTimeAsync(milliseconds));
}

describe('StationIdleLogout', () => {
	it('warns 30 s before the configured idle time and logs out when it runs out', async () => {
		const { onTimeout } = await setup();
		await advance(30_000);

		expect(
			await screen.findByRole('alertdialog', { name: /bezczynność/i }),
		).toHaveAccessibleDescription('Za 30 s nastąpi wylogowanie.');
		expect(
			screen.getByRole('button', { name: 'Zostaję zalogowany' }),
		).toHaveFocus();

		await advance(30_000);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});

	it('closes the warning and keeps the session after "Zostaję zalogowany"', async () => {
		const { onTimeout, user } = await setup();
		await advance(30_000);

		await user.click(
			await screen.findByRole('button', { name: 'Zostaję zalogowany' }),
		);
		await advance(30_000);

		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		expect(onTimeout).not.toHaveBeenCalled();
	});

	it('does nothing on a device that is not a station', async () => {
		const { onTimeout } = await setup({ isStation: false });

		await advance(5 * 60_000);

		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		expect(onTimeout).not.toHaveBeenCalled();
	});

	it('falls back to the default idle time when the settings cannot be loaded', async () => {
		server.use(
			http.get(
				'*/api/v1/settings/public',
				() => new HttpResponse(null, { status: 500 }),
			),
		);
		const { onTimeout } = await setup();
		const fallbackMilliseconds =
			config.station.idleLogoutFallbackMinutes * 60_000;

		await advance(fallbackMilliseconds - 1000);
		expect(onTimeout).not.toHaveBeenCalled();

		await advance(1000);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});
});
