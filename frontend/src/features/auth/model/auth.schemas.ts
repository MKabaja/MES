import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from '@/shared/api/primitives.schemas';

export const roleSchema = z.enum(['admin', 'worker']);

export const userSchema = z.object({
	id: idSchema,
	first_name: z.string(),
	last_name: z.string(),
	full_name: z.string(),
	login: z.string(),
	role: roleSchema,
	is_active: z.boolean(),
	created_at: isoDateTimeSchema,
});

export const userResponseSchema = z.object({ data: userSchema });
