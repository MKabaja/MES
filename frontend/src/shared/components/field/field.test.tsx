import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Checkbox } from '../checkbox/checkbox';
import { Input } from '../input/input';
import { Textarea } from '../textarea/textarea';
import { Field } from './field';

describe('Field', () => {
	it('labels the control and links the hint through aria-describedby', async () => {
		await renderWithProviders(
			<Field label="Nazwa" hint="Maksymalnie 50 znaków">
				<Input />
			</Field>,
		);

		const input = screen.getByRole('textbox', { name: 'Nazwa' });
		expect(input).toHaveAccessibleDescription('Maksymalnie 50 znaków');
		expect(input).not.toBeInvalid();
	});

	it('marks the control invalid and describes it with the error and the hint', async () => {
		await renderWithProviders(
			<Field
				label="Nazwa"
				hint="Maksymalnie 50 znaków"
				error="Pole jest wymagane"
			>
				<Input />
			</Field>,
		);

		const input = screen.getByRole('textbox', { name: 'Nazwa' });
		expect(input).toBeInvalid();
		expect(input).toHaveAccessibleDescription(
			expect.stringContaining('Pole jest wymagane'),
		);
		expect(input).toHaveAccessibleDescription(
			expect.stringContaining('Maksymalnie 50 znaków'),
		);
	});

	it('wires a textarea the same way', async () => {
		await renderWithProviders(
			<Field label="Uwagi" error="Za długie">
				<Textarea />
			</Field>,
		);

		const textarea = screen.getByRole('textbox', { name: 'Uwagi' });
		expect(textarea).toBeInvalid();
		expect(textarea).toHaveAccessibleDescription('Za długie');
	});

	it('names a checkbox by the horizontal field label and toggles it from the label', async () => {
		const { user } = await renderWithProviders(
			<Field label="Aktywny" orientation="horizontal">
				<Checkbox />
			</Field>,
		);

		const checkbox = screen.getByRole('checkbox', { name: 'Aktywny' });
		await user.click(screen.getByText('Aktywny'));

		expect(checkbox).toBeChecked();
	});
});
