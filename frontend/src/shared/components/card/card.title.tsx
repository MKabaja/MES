import type { ComponentProps } from 'react';

export type CardTitleProps = ComponentProps<'h2'>;

export function CardTitle({ className, ...props }: CardTitleProps) {
	return <h2 className={className} {...props} />;
}
