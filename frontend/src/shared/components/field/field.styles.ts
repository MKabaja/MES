import type { FieldOrientation } from './field.types';

type FieldPartStyles = {
	root: string;
	label?: string;
	control?: string;
	message?: string;
};

type FieldPartStylesByOrientation = Record<FieldOrientation, FieldPartStyles>;

export const fieldPartStylesByOrientation: FieldPartStylesByOrientation = {
	vertical: {
		root: 'flex flex-col gap-1.5',
	},
	horizontal: {
		root: 'grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5',
		label: 'col-start-2 row-start-1',
		control: 'col-start-1 row-start-1',
		message: 'col-start-2',
	},
};

export const fieldStyles = {
	label: 'text-[13px] leading-[18px] font-medium text-text',
	hint: 'text-[13px] leading-[18px] text-text-3',
	error: 'flex items-center gap-1.5 text-[13px] leading-[18px] text-danger',
	errorIcon: 'size-4 shrink-0 [stroke-width:1.7]',
} satisfies Record<string, string>;
