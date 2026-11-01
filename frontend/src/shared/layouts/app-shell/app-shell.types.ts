import type { LinkProps } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

export type AppShellNavItem = {
	to: NonNullable<LinkProps['to']>;
	label: string;
	icon: LucideIcon;
	counter?: number;
};

export type AppShellUser = {
	name: string;
	roleLabel: string;
};
