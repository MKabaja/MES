import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { TerminalShell } from './terminal-shell';

describe('TerminalShell', () => {
	it('calls onLogout from the logout button', async () => {
		const onLogout = vi.fn();
		const { user } = await renderWithProviders(
			<TerminalShell operatorName="Jan Kowalski" onLogout={onLogout}>
				<p>Treść</p>
			</TerminalShell>,
		);

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		expect(onLogout).toHaveBeenCalledTimes(1);
	});

	it('refreshes the clock in plant time after 15 seconds', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		vi.setSystemTime(new Date('2026-01-15T09:00:50Z'));
		await renderWithProviders(
			<TerminalShell operatorName="Jan Kowalski" onLogout={vi.fn()}>
				<p>Treść</p>
			</TerminalShell>,
		);
		expect(screen.getByText('10:00')).toBeInTheDocument();

		await act(() => vi.advanceTimersByTimeAsync(15_000));

		expect(screen.getByText('10:01')).toBeInTheDocument();
	});
});
