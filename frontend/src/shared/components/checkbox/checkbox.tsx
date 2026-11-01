import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { checkboxStyles } from './checkbox.styles';

export type CheckboxProps = Omit<CheckboxPrimitive.Root.Props, 'className'> & {
	className?: string;
};

/**
 * Renders a checkbox; pair it with a `Field` using `orientation="horizontal"` to get its label.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
	return (
		<CheckboxPrimitive.Root
			className={cn(checkboxStyles.root, className)}
			{...props}
		>
			<CheckboxPrimitive.Indicator className={checkboxStyles.indicator}>
				<Check aria-hidden="true" className={checkboxStyles.icon} />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}
