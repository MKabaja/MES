import { Select as SelectPrimitive } from '@base-ui/react/select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { selectStyles } from './select.styles';

export type SelectTriggerProps = Omit<
	SelectPrimitive.Trigger.Props,
	'className' | 'children'
> & {
	placeholder?: string | undefined;
	className?: string | undefined;
};

/**
 * Renders the button showing the selected item label, or `placeholder` while nothing is selected.
 */
export function SelectTrigger({
	placeholder,
	className,
	...props
}: SelectTriggerProps) {
	return (
		<SelectPrimitive.Trigger
			className={cn(selectStyles.trigger, className)}
			{...props}
		>
			<SelectPrimitive.Value
				placeholder={placeholder}
				className={selectStyles.value}
			/>
			<SelectPrimitive.Icon
				render={
					<ChevronDown aria-hidden="true" className={selectStyles.icon} />
				}
			/>
		</SelectPrimitive.Trigger>
	);
}
