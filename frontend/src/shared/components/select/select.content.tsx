import { Select as SelectPrimitive } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { selectStyles } from './select.styles';

export type SelectContentProps = { children: ReactNode };

/**
 * Renders the dropdown list in a portal below the trigger.
 */
export function SelectContent({ children }: SelectContentProps) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Positioner
				sideOffset={4}
				alignItemWithTrigger={false}
				className={selectStyles.positioner}
			>
				<SelectPrimitive.Popup className={selectStyles.popup}>
					<SelectPrimitive.List>{children}</SelectPrimitive.List>
				</SelectPrimitive.Popup>
			</SelectPrimitive.Positioner>
		</SelectPrimitive.Portal>
	);
}
