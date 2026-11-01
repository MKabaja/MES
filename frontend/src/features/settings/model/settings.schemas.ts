import { z } from 'zod';

const MIN_IDLE_LOGOUT_MINUTES = 1;
const MAX_IDLE_LOGOUT_MINUTES = 60;
const MIN_BACKDATE_DAYS = 0;
const MAX_BACKDATE_DAYS = 5;

export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const breakWindowSchema = z.object({
	start: timeOfDaySchema,
	end: timeOfDaySchema,
});

export const publicSettingsSchema = z.object({
	shift_start: timeOfDaySchema,
	shift_end: timeOfDaySchema,
	breaks: z.array(breakWindowSchema),
	worker_backdate_days: z.int().min(MIN_BACKDATE_DAYS).max(MAX_BACKDATE_DAYS),
	station_idle_logout_minutes: z
		.int()
		.min(MIN_IDLE_LOGOUT_MINUTES)
		.max(MAX_IDLE_LOGOUT_MINUTES),
});

export const publicSettingsResponseSchema = z.object({
	data: publicSettingsSchema,
});
