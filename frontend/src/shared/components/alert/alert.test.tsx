import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Alert } from './alert';

describe('Alert', () => {
	it('announces an error assertively', async () => {
		await renderWithProviders(<Alert variant="danger">Nie zapisano.</Alert>);

		expect(screen.getByRole('alert')).toHaveTextContent('Nie zapisano.');
	});

	it.each(['info', 'success', 'warning', 'exception'] as const)(
		'announces %s politely',
		async (variant) => {
			await renderWithProviders(<Alert variant={variant}>Zapisano.</Alert>);

			expect(screen.getByRole('status')).toHaveTextContent('Zapisano.');
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		},
	);
});
