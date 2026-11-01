import { useTranslation } from 'react-i18next';
import { Table, type TableProps } from '@/shared/components/table/table';
import { TableBody } from '@/shared/components/table/table.body';
import { TableCaption } from '@/shared/components/table/table.caption';
import { TableCell } from '@/shared/components/table/table.cell';
import { TableRow } from '@/shared/components/table/table.row';
import { tableSkeletonStyles } from './table-skeleton.styles';

export type TableSkeletonProps = Omit<
	TableProps,
	'label' | 'children' | 'aria-busy'
> & {
	columnCount: number;
	rowCount?: number | undefined;
};

/**
 * Renders placeholder rows shaped like the target table for the first load.
 * Marked `aria-busy` with a visually hidden caption so screen readers announce loading.
 */
export function TableSkeleton({
	columnCount,
	rowCount = 5,
	...tableProps
}: TableSkeletonProps) {
	const { t } = useTranslation();
	const columnIndexes = Array.from(
		{ length: columnCount },
		(_, index) => index,
	);
	const rowIndexes = Array.from({ length: rowCount }, (_, index) => index);

	return (
		<Table label={t('table.loading')} aria-busy="true" {...tableProps}>
			<TableCaption>{t('table.loading')}</TableCaption>
			<TableBody>
				{rowIndexes.map((rowIndex) => (
					<TableRow key={rowIndex}>
						{columnIndexes.map((columnIndex) => (
							<TableCell key={columnIndex}>
								<span aria-hidden="true" className={tableSkeletonStyles.bar} />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
