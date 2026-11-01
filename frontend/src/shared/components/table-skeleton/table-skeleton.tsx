import { useTranslation } from 'react-i18next';
import { Table, type TableProps } from '@/shared/components/table/table';
import { TableBody } from '@/shared/components/table/table.body';
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
 * The scroll region carries the `table.loading` name and the table is marked `aria-busy`, so loading is announced once.
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
