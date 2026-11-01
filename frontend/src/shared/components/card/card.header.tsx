import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { cardStyles } from './card.styles';

export type CardHeaderProps = ComponentProps<'header'>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
	return <header className={cn(cardStyles.header, className)} {...props} />;
}
