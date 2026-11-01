import type { ComponentProps } from 'react';

export type TableBodyProps = ComponentProps<'tbody'>;

export function TableBody(props: TableBodyProps) {
	return <tbody {...props} />;
}
