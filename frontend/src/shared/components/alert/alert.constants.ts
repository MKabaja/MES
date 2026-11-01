import {
	CircleCheck,
	Info,
	type LucideIcon,
	OctagonAlert,
	TriangleAlert,
} from 'lucide-react';
import type { AlertVariant } from './alert.types';

type IconByAlertVariant = Record<AlertVariant, LucideIcon>;
type RoleByAlertVariant = Record<AlertVariant, 'status' | 'alert'>;

export const iconByAlertVariant: IconByAlertVariant = {
	info: Info,
	success: CircleCheck,
	warning: TriangleAlert,
	danger: OctagonAlert,
	exception: TriangleAlert,
};

export const roleByAlertVariant: RoleByAlertVariant = {
	info: 'status',
	success: 'status',
	warning: 'status',
	danger: 'alert',
	exception: 'status',
};
