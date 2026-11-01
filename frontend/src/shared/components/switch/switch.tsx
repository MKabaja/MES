import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/shared/lib/utils';
import { switchStyles } from './switch.styles';

export type SwitchProps = Omit<SwitchPrimitive.Root.Props, 'className'> & {
	className?: string;
};

/**
 * Renders an on/off toggle; pair it with a `Field` using `orientation="horizontal"` to get its label.
 */
export function Switch({ className, ...props }: SwitchProps) {
	return (
		<SwitchPrimitive.Root
			className={cn(switchStyles.root, className)}
			{...props}
		>
			<SwitchPrimitive.Thumb className={switchStyles.thumb} />
		</SwitchPrimitive.Root>
	);
}
