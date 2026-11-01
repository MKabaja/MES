import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from './alert';

describe('Alert', () => {
	it('announces an error assertively', () => {
		render(<Alert variant="danger">Nie zapisano.</Alert>);

		expect(screen.getByRole('alert')).toHaveTextContent('Nie zapisano.');
	});

	it.each(['info', 'success', 'warning', 'exception'] as const)(
		'announces %s politely',
		(variant) => {
			render(<Alert variant={variant}>Zapisano.</Alert>);

			expect(screen.getByRole('status')).toHaveTextContent('Zapisano.');
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		},
	);
});
