import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import type { ReactElement } from 'react';
import { tooltipStyles } from './tooltip.styles';

export type TooltipProps = {
	label: string;
	children: ReactElement;
	side?: TooltipPrimitive.Positioner.Props['side'] | undefined;
};

/**
 * Shows `label` on hover and keyboard focus of the single focusable `children` element.
 * It only supplements the element's own accessible name (e.g. `aria-label` on icon buttons), it never replaces it.
 */
export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
	return (
		<TooltipPrimitive.Root>
			<TooltipPrimitive.Trigger delay={300} render={children} />
			<TooltipPrimitive.Portal>
				<TooltipPrimitive.Positioner
					side={side}
					sideOffset={6}
					className={tooltipStyles.positioner}
				>
					<TooltipPrimitive.Popup className={tooltipStyles.popup}>
						{label}
					</TooltipPrimitive.Popup>
				</TooltipPrimitive.Positioner>
			</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
	);
}
