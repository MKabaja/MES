import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { paginationStyles } from './pagination.styles';
import { getPageItems } from './pagination.utils';

export type PaginationProps = Omit<ComponentProps<'nav'>, 'children'> & {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
};

/**
 * Renders page navigation for a paginated list; pass `meta.current_page` and `meta.last_page`.
 * Renders nothing when there is a single page. Calls `onPageChange` instead of linking, so the caller decides how to store the page (e.g. router search params).
 */
export function Pagination({
	page: requestedPage,
	pageCount,
	onPageChange,
	className,
	...props
}: PaginationProps) {
	const { t } = useTranslation();
	const page = Math.min(Math.max(requestedPage, 1), pageCount);

	if (pageCount <= 1) {
		return null;
	}

	return (
		<nav aria-label={t('pagination.label')} className={className} {...props}>
			<ul className={paginationStyles.list}>
				<li>
					<Button
						variant="secondary"
						size="icon-sm"
						aria-label={t('pagination.previous')}
						disabled={page <= 1}
						onClick={() => onPageChange(page - 1)}
					>
						<ChevronLeft aria-hidden="true" />
					</Button>
				</li>
				{getPageItems(page, pageCount).map((item) =>
					typeof item === 'number' ? (
						<li key={item}>
							<Button
								variant={item === page ? 'primary' : 'secondary'}
								size="icon-sm"
								className={paginationStyles.pageButton}
								aria-label={t('pagination.page', { page: item })}
								aria-current={item === page ? 'page' : undefined}
								onClick={() => onPageChange(item)}
							>
								{item}
							</Button>
						</li>
					) : (
						<li
							key={item}
							aria-hidden="true"
							className={paginationStyles.ellipsis}
						>
							…
						</li>
					),
				)}
				<li>
					<Button
						variant="secondary"
						size="icon-sm"
						aria-label={t('pagination.next')}
						disabled={page >= pageCount}
						onClick={() => onPageChange(page + 1)}
					>
						<ChevronRight aria-hidden="true" />
					</Button>
				</li>
			</ul>
		</nav>
	);
}
