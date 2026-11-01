import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { NumberStepper } from './number-stepper';

type QuantityStepperProps = {
	initialValue: number;
	min?: number;
	max?: number;
	disabled?: boolean;
};

function QuantityStepper({
	initialValue,
	min,
	max,
	disabled,
}: QuantityStepperProps) {
	const [quantity, setQuantity] = useState<number | null>(initialValue);

	return (
		<NumberStepper
			aria-label="Ilość"
			value={quantity}
			onValueChange={setQuantity}
			min={min}
			max={max}
			disabled={disabled}
		/>
	);
}

describe('NumberStepper', () => {
	it('uses the numeric keypad', async () => {
		await renderWithProviders(<QuantityStepper initialValue={5} />);

		expect(screen.getByRole('textbox', { name: 'Ilość' })).toHaveAttribute(
			'inputmode',
			'numeric',
		);
	});

	it('increases and decreases the value by one', async () => {
		const { user } = await renderWithProviders(
			<QuantityStepper initialValue={5} min={0} max={10} />,
		);

		await user.click(screen.getByRole('button', { name: 'Zwiększ' }));
		expect(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('6');

		await user.click(screen.getByRole('button', { name: 'Zmniejsz' }));
		await user.click(screen.getByRole('button', { name: 'Zmniejsz' }));
		expect(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('4');
	});

	it('stops at the minimum and disables the decrease button there', async () => {
		const { user } = await renderWithProviders(
			<QuantityStepper initialValue={1} min={0} max={10} />,
		);

		await user.click(screen.getByRole('button', { name: 'Zmniejsz' }));

		expect(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('0');
		expect(screen.getByRole('button', { name: 'Zmniejsz' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Zwiększ' })).toBeEnabled();
	});

	it('stops at the maximum and disables the increase button there', async () => {
		const { user } = await renderWithProviders(
			<QuantityStepper initialValue={9} min={0} max={10} />,
		);

		await user.click(screen.getByRole('button', { name: 'Zwiększ' }));

		expect(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('10');
		expect(screen.getByRole('button', { name: 'Zwiększ' })).toBeDisabled();
	});

	it('ignores clicks when disabled', async () => {
		const { user } = await renderWithProviders(
			<QuantityStepper initialValue={3} disabled />,
		);

		await user.click(screen.getByRole('button', { name: 'Zwiększ' }));

		expect(screen.getByRole('textbox', { name: 'Ilość' })).toHaveValue('3');
		expect(screen.getByRole('button', { name: 'Zwiększ' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Zmniejsz' })).toBeDisabled();
	});
});
