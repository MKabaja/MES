import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import type { VariantProps } from 'class-variance-authority';
import { Minus, Plus } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';
import { cn } from '@/shared/lib/utils';
import {
	numberStepperInputVariants,
	numberStepperVariants,
} from './number-stepper.styles';

type NumberStepperSize = NonNullable<
	VariantProps<typeof numberStepperVariants>['size']
>;

type ButtonSizeByStepperSize = Record<
	NumberStepperSize,
	'icon' | 'icon-terminal'
>;

const buttonSizeByStepperSize: ButtonSizeByStepperSize = {
	default: 'icon',
	terminal: 'icon-terminal',
};

export type NumberStepperProps = Omit<
	NumberFieldPrimitive.Root.Props,
	'className' | 'children' | 'size'
> & {
	size?: NumberStepperSize;
	'aria-label'?: string;
	inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
	className?: string;
};

/**
 * Renders a number input with decrease and increase buttons that stop at `min` and `max`.
 * The `terminal` size gives 56 px touch targets; pass `aria-label` when no `Field` labels it.
 */
export function NumberStepper({
	size = 'default',
	'aria-label': ariaLabel,
	inputMode = 'numeric',
	className,
	...rootProps
}: NumberStepperProps) {
	const { t } = useTranslation();
	const buttonSize = buttonSizeByStepperSize[size];

	return (
		<NumberFieldPrimitive.Root {...rootProps}>
			<NumberFieldPrimitive.Group
				className={cn(numberStepperVariants({ size }), className)}
			>
				<NumberFieldPrimitive.Decrement
					render={<Button variant="secondary" size={buttonSize} />}
					aria-label={t('numberStepper.decrease')}
				>
					<Minus aria-hidden="true" />
				</NumberFieldPrimitive.Decrement>
				<NumberFieldPrimitive.Input
					aria-label={ariaLabel}
					inputMode={inputMode}
					className={numberStepperInputVariants({ size })}
				/>
				<NumberFieldPrimitive.Increment
					render={<Button variant="secondary" size={buttonSize} />}
					aria-label={t('numberStepper.increase')}
				>
					<Plus aria-hidden="true" />
				</NumberFieldPrimitive.Increment>
			</NumberFieldPrimitive.Group>
		</NumberFieldPrimitive.Root>
	);
}
