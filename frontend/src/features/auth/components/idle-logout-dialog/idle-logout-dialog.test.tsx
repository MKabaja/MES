import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { IdleLogoutDialog } from './idle-logout-dialog';

async function setup() {
	const onStay = vi.fn();
	const view = await renderWithProviders(
		<IdleLogoutDialog open secondsLeft={30} onStay={onStay} />,
	);
	await screen.findByRole('alertdialog', { name: /bezczynność/i });
	return { onStay, ...view };
}

describe('IdleLogoutDialog', () => {
	it('keeps the session on Escape', async () => {
		const { onStay, user } = await setup();

		await user.keyboard('{Escape}');

		expect(onStay).toHaveBeenCalledTimes(1);
	});

	it('keeps the session from the close button', async () => {
		const { onStay, user } = await setup();

		await user.click(screen.getByRole('button', { name: 'Zamknij' }));

		expect(onStay).toHaveBeenCalledTimes(1);
	});
});
