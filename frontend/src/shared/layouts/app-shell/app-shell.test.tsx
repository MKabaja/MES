import { act, screen, within } from '@testing-library/react';
import { LayoutDashboard } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeStorage } from '@/shared/lib/storage';
import { renderWithProviders } from '@/test/render';
import { AppShell } from './app-shell';
import type { AppShellNavItem } from './app-shell.types';

const navItems: AppShellNavItem[] = [
	{ to: '/login', label: 'Panel', icon: LayoutDashboard, counter: 3 },
];

type ChangeListener = (event: { matches: boolean }) => void;

function stubMatchMedia(): (matches: boolean) => void {
	const listeners = new Set<ChangeListener>();
	vi.stubGlobal('matchMedia', () => ({
		matches: false,
		addEventListener: (_type: string, listener: ChangeListener) =>
			listeners.add(listener),
		removeEventListener: (_type: string, listener: ChangeListener) =>
			listeners.delete(listener),
	}));
	return (matches) => {
		for (const listener of listeners) {
			listener({ matches });
		}
	};
}

function buildShell(onLogout: () => void = vi.fn()) {
	return (
		<AppShell
			user={{ name: 'Jan Kowalski', roleLabel: 'Kierownik' }}
			navItems={navItems}
			onLogout={onLogout}
		>
			<p>Treść strony</p>
		</AppShell>
	);
}

beforeEach(() => {
	vi.unstubAllGlobals();
	stubMatchMedia();
	writeStorage('mes.sidebarCollapsed', false);
});

describe('AppShell', () => {
	it('remembers the collapsed sidebar after it is rendered again', async () => {
		const { user, unmount } = await renderWithProviders(buildShell());

		await user.click(screen.getByRole('button', { name: 'Zwiń menu' }));
		unmount();
		await renderWithProviders(buildShell());

		expect(
			screen.getByRole('button', { name: 'Rozwiń menu' }),
		).toBeInTheDocument();
	});

	it('includes the counter in the item name when expanded', async () => {
		await renderWithProviders(buildShell());

		expect(
			screen.getByRole('link', { name: /panel\s*3/i }),
		).toBeInTheDocument();
	});

	it('keeps the item name and counter available when collapsed', async () => {
		writeStorage('mes.sidebarCollapsed', true);
		await renderWithProviders(buildShell());

		expect(
			screen.getByRole('link', { name: /panel\s*3/i }),
		).toBeInTheDocument();
	});

	it('calls onLogout from the logout button', async () => {
		const onLogout = vi.fn();
		const { user } = await renderWithProviders(buildShell(onLogout));

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		expect(onLogout).toHaveBeenCalledTimes(1);
	});

	it('closes the mobile menu when the viewport becomes desktop-wide', async () => {
		const changeViewport = stubMatchMedia();
		const { user } = await renderWithProviders(buildShell());
		await user.click(screen.getByRole('button', { name: 'Otwórz menu' }));
		await screen.findByRole('dialog', { name: 'Menu główne' });

		act(() => changeViewport(true));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('marks the item of the current page with aria-current', async () => {
		await renderWithProviders(buildShell(), { route: '/login' });

		expect(screen.getByRole('link', { name: /panel/i })).toHaveAttribute(
			'aria-current',
			'page',
		);
	});

	it('does not mark the item when another page is current', async () => {
		await renderWithProviders(buildShell(), { route: '/inna-strona' });

		expect(screen.getByRole('link', { name: /panel/i })).not.toHaveAttribute(
			'aria-current',
		);
	});

	it('hides the counter when it is zero', async () => {
		await renderWithProviders(
			<AppShell
				user={{ name: 'Jan Kowalski', roleLabel: 'Kierownik' }}
				navItems={[
					{ to: '/login', label: 'Panel', icon: LayoutDashboard, counter: 0 },
				]}
				onLogout={vi.fn()}
			>
				<p>Treść strony</p>
			</AppShell>,
		);

		expect(screen.getByRole('link', { name: 'Panel' })).toBeInTheDocument();
	});

	it('opens the mobile menu and closes it with Escape', async () => {
		const { user } = await renderWithProviders(buildShell());

		await user.click(screen.getByRole('button', { name: 'Otwórz menu' }));
		const drawer = await screen.findByRole('dialog', { name: 'Menu główne' });
		expect(within(drawer).getByRole('link', { name: /panel/i })).toBeVisible();
		await user.keyboard('{Escape}');

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('closes the mobile menu after choosing an item', async () => {
		const { user } = await renderWithProviders(buildShell());

		await user.click(screen.getByRole('button', { name: 'Otwórz menu' }));
		const drawer = await screen.findByRole('dialog', { name: 'Menu główne' });
		await user.click(within(drawer).getByRole('link', { name: /panel/i }));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
