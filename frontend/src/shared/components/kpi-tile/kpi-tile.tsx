import type { WellProps } from '@/shared/components/well/well';
import { Well } from '@/shared/components/well/well';
import { cn } from '@/shared/lib/utils';
import { kpiTileStyles } from './kpi-tile.styles';

export type KpiTileProps = Omit<WellProps, 'children'> & {
	label: string;
	value: number | string;
};

/**
 * Shows one headline number with its label inside a well.
 */
export function KpiTile({ label, value, className, ...props }: KpiTileProps) {
	return (
		<Well className={cn(kpiTileStyles.root, className)} {...props}>
			<span className={kpiTileStyles.label}>{label}</span>
			<span className={kpiTileStyles.value}>{value}</span>
		</Well>
	);
}
