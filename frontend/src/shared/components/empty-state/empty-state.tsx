import type { ReactNode } from 'react';
import type { WellProps } from '@/shared/components/well/well';
import { Well } from '@/shared/components/well/well';
import { cn } from '@/shared/lib/utils';
import { emptyStateStyles } from './empty-state.styles';

export type EmptyStateProps = Omit<WellProps, 'children'> & {
	message: string;
	action?: ReactNode;
};

/**
 * Shows the message for an empty list in a well, with an optional action button below.
 */
export function EmptyState({
	message,
	action,
	className,
	...props
}: EmptyStateProps) {
	return (
		<Well className={cn(emptyStateStyles.root, className)} {...props}>
			<p className={emptyStateStyles.message}>{message}</p>
			{action}
		</Well>
	);
}
