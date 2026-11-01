import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { TableSkeleton } from './table-skeleton';

it('announces loading once through the named region around a busy table', async () => {
	await renderWithProviders(<TableSkeleton columnCount={3} />);

	expect(screen.getByRole('region')).toHaveAccessibleName('Ładowanie danych…');
	expect(screen.getByRole('table', { busy: true })).not.toHaveAccessibleName();
});
