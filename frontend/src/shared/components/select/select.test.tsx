import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Field } from '../field/field';
import { Select } from './select';
import { SelectContent } from './select.content';
import { SelectItem } from './select.item';
import { SelectTrigger } from './select.trigger';

type Role = 'welder' | 'office';

const roleItems = [
	{ value: 'welder', label: 'Spawacz' },
	{ value: 'office', label: 'Biuro' },
] satisfies Array<{ value: Role; label: string }>;

function RoleSelect() {
	return (
		<Field label="Rola">
			<Select items={roleItems} defaultValue="welder">
				<SelectTrigger />
				<SelectContent>
					{roleItems.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

describe('Select', () => {
	it('shows the label of the selected item instead of its value', async () => {
		await renderWithProviders(<RoleSelect />);

		const trigger = screen.getByRole('combobox', { name: /Rola/ });
		expect(trigger).toHaveTextContent('Spawacz');
		expect(trigger).not.toHaveTextContent('welder');
	});
});
