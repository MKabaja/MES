import { screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Field } from '../field/field';
import { Input } from './input';

describe('Input', () => {
	it('keeps the label and error wiring with an icon and hides the icon from assistive tech', async () => {
		await renderWithProviders(
			<Field label="Szukaj" error="Błąd">
				<Input startIcon={<Search data-testid="icon" />} />
			</Field>,
		);

		const input = screen.getByRole('textbox', { name: 'Szukaj' });
		expect(input).toBeInvalid();
		expect(
			screen.getByTestId('icon').closest('[aria-hidden="true"]'),
		).not.toBeNull();
	});

	it('keeps an action button inside the field accessible and clickable', async () => {
		const onClick = vi.fn();
		const { user } = await renderWithProviders(
			<Input
				endAction={
					<button type="button" aria-label="Pokaż hasło" onClick={onClick} />
				}
			/>,
		);

		await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
