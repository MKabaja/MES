import {
	Check,
	CircleDashed,
	type LucideIcon,
	Pause,
	Play,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusPill, type StatusPillProps } from './status-pill';
import type { OperationStatus } from './status-pill.types';

type IconByOperationStatus = Record<OperationStatus, LucideIcon>;

const iconByOperationStatus: IconByOperationStatus = {
	pending: CircleDashed,
	in_progress: Play,
	paused: Pause,
	completed: Check,
};

export type OperationStatusPillProps = Omit<
	StatusPillProps,
	'variant' | 'children'
> & {
	status: OperationStatus;
};

/**
 * Renders an operation or position status with its icon, translated name and colour.
 */
export function OperationStatusPill({
	status,
	...props
}: OperationStatusPillProps) {
	const { t } = useTranslation();
	const Icon = iconByOperationStatus[status];

	return (
		<StatusPill variant={status} {...props}>
			<Icon aria-hidden="true" />
			{t(`operationStatus.${status}`)}
		</StatusPill>
	);
}
