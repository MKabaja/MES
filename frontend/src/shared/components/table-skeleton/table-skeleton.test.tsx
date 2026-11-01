import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { TableSkeleton } from './table-skeleton';

it('announces a busy table with a caption for screen readers', async () => {
	await renderWithProviders(<TableSkeleton columnCount={3} />);

	expect(screen.getByRole('table', { busy: true })).toHaveAccessibleName(
		'Ładowanie danych…',
	);
});
