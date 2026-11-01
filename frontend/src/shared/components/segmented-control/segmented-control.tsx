import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { cn } from '@/shared/lib/utils';
import { segmentedControlStyles } from './segmented-control.styles';

export type SegmentedControlProps<Value extends string> = Omit<
	RadioGroupPrimitive.Props<Value>,
	'className'
> & { size?: 'default' | 'terminal'; className?: string };

/**
 * Renders a `radiogroup` of 2-4 mutually exclusive options navigable with arrow keys; give it an `aria-label`.
 */
export function SegmentedControl<Value extends string>({
	size = 'default',
	className,
	...props
}: SegmentedControlProps<Value>) {
	return (
		<RadioGroupPrimitive
			data-size={size}
			className={cn(segmentedControlStyles.root, className)}
			{...props}
		/>
	);
}
