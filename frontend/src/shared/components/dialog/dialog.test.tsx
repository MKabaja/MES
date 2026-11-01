import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Dialog } from './dialog';
import { DialogBody } from './dialog.body';
import { DialogCancel } from './dialog.cancel';
import { DialogContent } from './dialog.content';
import { DialogDescription } from './dialog.description';
import { DialogFooter } from './dialog.footer';

function ControlledDialog() {
	const [open, setOpen] = useState(true);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent title="Nowy materiał">
				<DialogDescription>Uzupełnij dane materiału.</DialogDescription>
				<DialogBody>Treść</DialogBody>
				<DialogFooter>
					<DialogCancel />
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

describe('Dialog', () => {
	it('names the window after the title and describes it', async () => {
		await renderWithProviders(<ControlledDialog />);

		const dialog = await screen.findByRole('dialog', { name: 'Nowy materiał' });

		expect(dialog).toHaveAccessibleDescription('Uzupełnij dane materiału.');
	});

	it('closes with the Zamknij button', async () => {
		const { user } = await renderWithProviders(<ControlledDialog />);

		await user.click(await screen.findByRole('button', { name: 'Zamknij' }));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('closes with Anuluj', async () => {
		const { user } = await renderWithProviders(<ControlledDialog />);

		await user.click(await screen.findByRole('button', { name: 'Anuluj' }));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
