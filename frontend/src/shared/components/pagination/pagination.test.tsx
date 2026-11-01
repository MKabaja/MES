import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Pagination } from './pagination';
import { getPageItems } from './pagination.utils';

describe('getPageItems', () => {
	it('lists every page when there are few', () => {
		expect(getPageItems(2, 4)).toEqual([1, 2, 3, 4]);
	});

	it('collapses distant pages into ellipses on both sides', () => {
		expect(getPageItems(6, 12)).toEqual([
			1,
			'ellipsis-before',
			5,
			6,
			7,
			'ellipsis-after',
			12,
		]);
	});

	it('fills a one-page gap instead of an ellipsis', () => {
		expect(getPageItems(4, 9)).toEqual([1, 2, 3, 4, 5, 'ellipsis-after', 9]);
	});

	it('clamps an out-of-range page', () => {
		expect(getPageItems(99, 3)).toEqual([1, 2, 3]);
		expect(getPageItems(0, 3)).toEqual([1, 2, 3]);
	});

	it('keeps the first and last pages at the edges', () => {
		expect(getPageItems(1, 10)).toEqual([1, 2, 'ellipsis-after', 10]);
		expect(getPageItems(10, 10)).toEqual([1, 'ellipsis-before', 9, 10]);
	});
});

describe('Pagination', () => {
	async function setup(page: number, pageCount = 10) {
		const onPageChange = vi.fn();
		const rendered = await renderWithProviders(
			<Pagination
				page={page}
				pageCount={pageCount}
				onPageChange={onPageChange}
			/>,
		);
		return { ...rendered, onPageChange };
	}

	it('marks the current page and requests the clicked one', async () => {
		const { user, onPageChange } = await setup(5);

		expect(screen.getByRole('button', { name: 'Strona 5' })).toHaveAttribute(
			'aria-current',
			'page',
		);
		expect(
			screen.getByRole('button', { name: 'Strona 6' }),
		).not.toHaveAttribute('aria-current');

		await user.click(screen.getByRole('button', { name: 'Strona 6' }));
		await user.click(screen.getByRole('button', { name: 'Następna strona' }));
		await user.click(screen.getByRole('button', { name: 'Poprzednia strona' }));

		expect(onPageChange).toHaveBeenNthCalledWith(1, 6);
		expect(onPageChange).toHaveBeenNthCalledWith(2, 6);
		expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
	});

	it('disables previous on the first page', async () => {
		await setup(1);

		expect(
			screen.getByRole('button', { name: 'Poprzednia strona' }),
		).toBeDisabled();
		expect(
			screen.getByRole('button', { name: 'Następna strona' }),
		).toBeEnabled();
	});

	it('disables next on the last page', async () => {
		await setup(10);

		expect(
			screen.getByRole('button', { name: 'Następna strona' }),
		).toBeDisabled();
		expect(
			screen.getByRole('button', { name: 'Poprzednia strona' }),
		).toBeEnabled();
	});

	it('renders nothing for a single page', async () => {
		await setup(1, 1);

		expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
	});
});
