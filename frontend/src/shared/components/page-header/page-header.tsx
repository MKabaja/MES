import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { pageHeaderStyles } from './page-header.styles';

export type PageHeaderProps = Omit<
	ComponentProps<'header'>,
	'children' | 'title'
> & {
	title: string;
	description?: string | undefined;
	actions?: ReactNode | undefined;
};

/**
 * Renders the page `h1` with an optional subtitle and actions aligned to the right.
 */
export function PageHeader({
	title,
	description,
	actions,
	className,
	...props
}: PageHeaderProps) {
	return (
		<header className={cn(pageHeaderStyles.root, className)} {...props}>
			<div className={pageHeaderStyles.text}>
				<h1>{title}</h1>
				{description ? (
					<p className={pageHeaderStyles.description}>{description}</p>
				) : null}
			</div>
			{actions ? (
				<div className={pageHeaderStyles.actions}>{actions}</div>
			) : null}
		</header>
	);
}
