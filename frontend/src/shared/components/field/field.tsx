import { Field as FieldPrimitive } from '@base-ui/react/field';
import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { fieldPartStylesByOrientation, fieldStyles } from './field.styles';
import type { FieldOrientation } from './field.types';

export type FieldProps = Omit<
	FieldPrimitive.Root.Props,
	'className' | 'children' | 'invalid'
> & {
	label: string;
	hint?: string;
	error?: string;
	orientation?: FieldOrientation;
	className?: string;
	children: ReactNode;
};

/**
 * Wraps one control with its label, hint and error, wired through `aria-describedby` and `aria-invalid`.
 * Use `orientation="horizontal"` for a checkbox or switch placed before its label.
 */
export function Field({
	label,
	hint,
	error,
	orientation = 'vertical',
	className,
	children,
	...rootProps
}: FieldProps) {
	const partStyles = fieldPartStylesByOrientation[orientation];
	const hasError = error !== undefined;

	return (
		<FieldPrimitive.Root
			invalid={hasError}
			className={cn(partStyles.root, className)}
			{...rootProps}
		>
			<FieldPrimitive.Label className={cn(fieldStyles.label, partStyles.label)}>
				{label}
			</FieldPrimitive.Label>
			<div className={partStyles.control}>{children}</div>
			{hint ? (
				<FieldPrimitive.Description
					className={cn(fieldStyles.hint, partStyles.message)}
				>
					{hint}
				</FieldPrimitive.Description>
			) : null}
			{hasError ? (
				<FieldPrimitive.Error
					match
					className={cn(fieldStyles.error, partStyles.message)}
				>
					<TriangleAlert aria-hidden="true" className={fieldStyles.errorIcon} />
					{error}
				</FieldPrimitive.Error>
			) : null}
		</FieldPrimitive.Root>
	);
}
