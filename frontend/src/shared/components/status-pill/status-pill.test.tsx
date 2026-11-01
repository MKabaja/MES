import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { OperationStatusPill } from './status-pill.operation';

it('shows the status name as text and hides the decorative icon', async () => {
	const { container } = await renderWithProviders(
		<OperationStatusPill status="paused" />,
	);

	expect(screen.getByText('Pauza')).toBeInTheDocument();
	expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});
