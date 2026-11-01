import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { readStorage, writeStorage } from '@/shared/lib/storage';
import { renderWithProviders } from '@/test/render';
import { StationModeToggle } from './station-mode-toggle';

beforeEach(() => {
	writeStorage('mes.stationMode', false);
});

describe('StationModeToggle', () => {
	it('remembers that the device is a station', async () => {
		const { user } = await renderWithProviders(<StationModeToggle />);

		await user.click(
			screen.getByRole('checkbox', { name: /stanowisko na hali/i }),
		);

		expect(readStorage('mes.stationMode')).toBe(true);
	});

	it('starts checked when the device was already marked and clears the mark when unchecked', async () => {
		writeStorage('mes.stationMode', true);
		const { user } = await renderWithProviders(<StationModeToggle />);
		const checkbox = screen.getByRole('checkbox', {
			name: /stanowisko na hali/i,
		});

		expect(checkbox).toBeChecked();
		await user.click(checkbox);

		expect(readStorage('mes.stationMode')).toBe(false);
	});
});
