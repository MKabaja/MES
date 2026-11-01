import type { z } from 'zod';
import type { roleSchema, userSchema } from './auth.schemas';

export type Role = z.infer<typeof roleSchema>;

export type User = z.infer<typeof userSchema>;

export type LoginCredentials = {
	login: string;
	password: string;
};
