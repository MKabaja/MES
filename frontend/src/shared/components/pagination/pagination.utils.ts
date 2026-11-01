export type PageItem = number | 'ellipsis-before' | 'ellipsis-after';

/**
 * Lists the page buttons to show: first, last and the current page (clamped to `1..pageCount`) with one neighbour each side.
 * A gap of a single page is filled with that page instead of an ellipsis.
 */
export function getPageItems(
	requestedPage: number,
	pageCount: number,
): PageItem[] {
	const page = Math.min(Math.max(requestedPage, 1), pageCount);
	const visiblePages = [...new Set([1, page - 1, page, page + 1, pageCount])]
		.filter((candidate) => candidate >= 1 && candidate <= pageCount)
		.sort((first, second) => first - second);

	return visiblePages.flatMap((visiblePage, index): PageItem[] => {
		const previousPage = visiblePages[index - 1];
		if (previousPage === undefined) {
			return [visiblePage];
		}
		const gap = visiblePage - previousPage - 1;
		if (gap === 0) {
			return [visiblePage];
		}
		if (gap === 1) {
			return [previousPage + 1, visiblePage];
		}
		const ellipsis = visiblePage <= page ? 'ellipsis-before' : 'ellipsis-after';
		return [ellipsis, visiblePage];
	});
}
