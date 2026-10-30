import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RouteError, RoutePending } from './route-fallbacks';

describe('RouteError', () => {
	it('announces the error and calls reset on retry', async () => {
		const user = userEvent.setup();
		const reset = vi.fn();
		render(<RouteError reset={reset} />);

		expect(screen.getByRole('alert')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: /spróbuj ponownie/i }));

		expect(reset).toHaveBeenCalledTimes(1);
	});
});

describe('RoutePending', () => {
	it('exposes a status region', () => {
		render(<RoutePending />);

		expect(screen.getByRole('status')).toHaveTextContent(/ładowanie/i);
	});
});
