import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { segmentedControlStyles } from './segmented-control.styles';

export type SegmentedControlOptionProps<Value extends string> = Omit<
	RadioPrimitive.Root.Props<Value>,
	'className'
>;

/**
 * Renders one option of a `SegmentedControl`; its children (text, optional icon) are the accessible name.
 */
export function SegmentedControlOption<Value extends string>(
	props: SegmentedControlOptionProps<Value>,
) {
	return (
		<RadioPrimitive.Root className={segmentedControlStyles.option} {...props} />
	);
}
