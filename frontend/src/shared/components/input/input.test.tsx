import { screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { describe, expect, it } from 'vitest';
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
});
