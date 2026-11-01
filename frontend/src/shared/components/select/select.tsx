import { Select as SelectPrimitive } from '@base-ui/react/select';

export type SelectOption<Value extends string> = {
	value: Value;
	label: string;
};

export type SelectProps<Value extends string> = Omit<
	SelectPrimitive.Root.Props<Value>,
	'items' | 'multiple'
> & { items: ReadonlyArray<SelectOption<Value>> };

/**
 * Holds the single-select state; `items` is required so the trigger shows the selected label instead of its value.
 * Compose it with `SelectTrigger`, `SelectContent` and `SelectItem`.
 */
export function Select<Value extends string>(props: SelectProps<Value>) {
	return <SelectPrimitive.Root {...props} />;
}
