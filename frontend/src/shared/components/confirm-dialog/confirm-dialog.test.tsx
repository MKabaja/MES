import { screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

function ControlledDialog(props: Partial<ConfirmDialogProps>) {
	const [open, setOpen] = useState(true);

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={setOpen}
			title="Usunąć zlecenie?"
			description="Tej operacji nie można cofnąć."
			confirmLabel="Usuń"
			onConfirm={vi.fn()}
			{...props}
		/>
	);
}

async function setup(props: Partial<ConfirmDialogProps> = {}) {
	const onConfirm = vi.fn();
	const rendered = await renderWithProviders(
		<ControlledDialog onConfirm={onConfirm} {...props} />,
	);
	return { ...rendered, onConfirm };
}

describe('ConfirmDialog', () => {
	it('describes the question and focuses Anuluj first', async () => {
		await setup();

		const dialog = await screen.findByRole('alertdialog', {
			name: 'Usunąć zlecenie?',
		});

		expect(dialog).toHaveAccessibleDescription(
			'Tej operacji nie można cofnąć.',
		);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Anuluj' })).toHaveFocus(),
		);
	});

	it('calls onConfirm once when the action is clicked', async () => {
		const { user, onConfirm } = await setup();

		await user.click(await screen.findByRole('button', { name: 'Usuń' }));

		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it('closes on Anuluj without confirming', async () => {
		const { user, onConfirm } = await setup();

		await user.click(await screen.findByRole('button', { name: 'Anuluj' }));

		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('closes on Escape without confirming', async () => {
		const { user, onConfirm } = await setup();
		await screen.findByRole('alertdialog');

		await user.keyboard('{Escape}');

		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('blocks every way out while pending', async () => {
		const { user, onConfirm } = await setup({ pending: true });
		const confirm = await screen.findByRole('button', { name: 'Usuń' });

		await user.click(confirm);
		await user.click(screen.getByRole('button', { name: 'Anuluj' }));
		await user.keyboard('{Escape}');

		expect(onConfirm).not.toHaveBeenCalled();
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();
	});
});
