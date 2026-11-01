import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check } from 'lucide-react';
import { selectStyles } from './select.styles';

export type SelectItemProps = Omit<SelectPrimitive.Item.Props, 'className'>;

/**
 * Renders one selectable option with a check mark when it is selected.
 */
export function SelectItem({ children, ...props }: SelectItemProps) {
	return (
		<SelectPrimitive.Item className={selectStyles.item} {...props}>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
			<SelectPrimitive.ItemIndicator className={selectStyles.itemIndicator}>
				<Check aria-hidden="true" className={selectStyles.itemIcon} />
			</SelectPrimitive.ItemIndicator>
		</SelectPrimitive.Item>
	);
}
