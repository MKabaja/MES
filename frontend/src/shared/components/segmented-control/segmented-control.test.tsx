import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { SegmentedControl } from './segmented-control';
import { SegmentedControlOption } from './segmented-control.option';

type Shift = 'morning' | 'afternoon' | 'night';

function ShiftPicker({ onChange }: { onChange?: (value: Shift) => void }) {
	const [shift, setShift] = useState<Shift>('morning');

	function handleValueChange(value: Shift) {
		setShift(value);
		onChange?.(value);
	}

	return (
		<SegmentedControl
			aria-label="Zmiana"
			value={shift}
			onValueChange={handleValueChange}
		>
			<SegmentedControlOption value="morning">Rano</SegmentedControlOption>
			<SegmentedControlOption value="afternoon">
				Popołudnie
			</SegmentedControlOption>
			<SegmentedControlOption value="night">Noc</SegmentedControlOption>
		</SegmentedControl>
	);
}

describe('SegmentedControl', () => {
	it('exposes a named radiogroup with the selected option checked', async () => {
		await renderWithProviders(<ShiftPicker />);

		expect(screen.getByRole('radiogroup', { name: 'Zmiana' })).toBeVisible();
		expect(screen.getByRole('radio', { name: 'Rano' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Noc' })).not.toBeChecked();
	});

	it('selects the clicked option and reports it once', async () => {
		const onChange = vi.fn();
		const { user } = await renderWithProviders(
			<ShiftPicker onChange={onChange} />,
		);

		await user.click(screen.getByRole('radio', { name: 'Noc' }));

		expect(screen.getByRole('radio', { name: 'Noc' })).toBeChecked();
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith('night');
	});

	it('moves the selection with arrow keys from the focused option', async () => {
		const { user } = await renderWithProviders(<ShiftPicker />);

		await user.tab();
		await user.keyboard('{ArrowRight}');
		expect(screen.getByRole('radio', { name: 'Popołudnie' })).toBeChecked();

		await user.keyboard('{ArrowLeft}');
		expect(screen.getByRole('radio', { name: 'Rano' })).toBeChecked();
	});
});
