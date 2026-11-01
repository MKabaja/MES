import type { z } from 'zod';
import type {
	loginFormSchema,
	roleSchema,
	sessionBroadcastMessageSchema,
	userSchema,
} from './auth.schemas';

export type Role = z.infer<typeof roleSchema>;

export type User = z.infer<typeof userSchema>;

export type LoginCredentials = {
	login: string;
	password: string;
};

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export type SessionBroadcastMessage = z.infer<
	typeof sessionBroadcastMessageSchema
>;

declare module '@tanstack/history' {
	interface HistoryState {
		sessionEndedMessage?: string;
	}
}
