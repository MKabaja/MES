import { Link } from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from './render';

describe('renderWithProviders', () => {
	it('renders the given ui inside router context', async () => {
		await renderWithProviders(<Link to="/">Start</Link>);

		expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute(
			'href',
			'/',
		);
	});
});
