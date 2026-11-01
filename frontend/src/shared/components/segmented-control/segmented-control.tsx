import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { segmentedControlVariants } from './segmented-control.styles';

export type SegmentedControlProps<Value extends string> = Omit<
	RadioGroupPrimitive.Props<Value>,
	'className'
> &
	VariantProps<typeof segmentedControlVariants> & {
		className?: string | undefined;
	};

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
			className={cn(segmentedControlVariants({ size }), className)}
			{...props}
		/>
	);
}
