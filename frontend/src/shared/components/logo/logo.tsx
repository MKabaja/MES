import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { logoStyles } from './logo.styles';

export type LogoProps = Omit<ComponentProps<'svg'>, 'children' | 'title'> & {
	title?: string | undefined;
};

/**
 * Renders the MES welding-arc mark in the accent colour.
 * Without `title` it is decorative and hidden from assistive technology; pass `title` when it stands alone.
 */
export function Logo({ title, className, ...props }: LogoProps) {
	return (
		<svg
			viewBox="0 0 40 40"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.3}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn(logoStyles.root, className)}
			role={title ? 'img' : undefined}
			aria-label={title}
			aria-hidden={title ? undefined : true}
			{...props}
		>
			<path d="M30 6 21 17" />
			<path d="M32 8 28 4" />
			<path d="m21 17 4 4-6 2 3 5" />
			<path d="M8 33h24" />
			<path d="m13 25-3-2" />
			<path d="m30 26 3-2" />
			<path d="m16 29-3 2" />
		</svg>
	);
}
