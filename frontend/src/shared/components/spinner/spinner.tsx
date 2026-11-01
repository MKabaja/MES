import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { spinnerStyles } from './spinner.styles';

export type SpinnerProps = Omit<
	ComponentProps<typeof LoaderCircle>,
	'children'
>;

/**
 * Renders a decorative spinning icon for a button in a pending state; the button must keep its text and expose the state itself (e.g. `disabled`, `aria-busy`).
 * The icon takes its size from the button, so it fits both regular and terminal buttons.
 */
export function Spinner({ className, ...props }: SpinnerProps) {
	return (
		<LoaderCircle
			aria-hidden="true"
			className={cn(spinnerStyles.root, className)}
			{...props}
		/>
	);
}
