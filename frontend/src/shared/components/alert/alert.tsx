import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { iconByAlertVariant, roleByAlertVariant } from './alert.constants';
import { alertStyles, alertVariants } from './alert.styles';
import type { AlertVariant } from './alert.types';

export type AlertProps = Omit<ComponentProps<'div'>, 'children'> & {
	variant?: AlertVariant | undefined;
	children: ReactNode;
};

/**
 * Renders an inline message with a state icon; `danger` announces as `role="alert"`, other variants as `role="status"`.
 * Compose the content from {@link AlertTitle} and {@link AlertDescription}.
 */
export function Alert({
	variant = 'info',
	className,
	children,
	...props
}: AlertProps) {
	const Icon = iconByAlertVariant[variant];

	return (
		<div
			role={roleByAlertVariant[variant]}
			className={cn(alertVariants({ variant }), className)}
			{...props}
		>
			<Icon aria-hidden="true" className={alertStyles.icon} />
			<div className={alertStyles.content}>{children}</div>
		</div>
	);
}
