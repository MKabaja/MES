import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';

describe('index route', () => {
	it('renders the home page at /', async () => {
		await renderWithProviders(undefined, { route: '/' });

		expect(
			await screen.findByRole('heading', { name: 'OK' }),
		).toBeInTheDocument();
	});

	it('shows the not found page for an unknown path', async () => {
		await renderWithProviders(undefined, { route: '/nie-ma-takiej-strony' });

		expect(
			await screen.findByRole('heading', { name: /nie znaleziono strony/i }),
		).toBeInTheDocument();
	});
});
