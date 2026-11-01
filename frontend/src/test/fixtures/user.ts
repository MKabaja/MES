import { userSchema } from '@/features/auth/model/auth.schemas';
import type { User } from '@/features/auth/model/auth.types';

/**
 * Builds a contract-valid `User` (a worker by default); throws when the overrides break the schema.
 */
export function buildUser(overrides: Partial<User> = {}): User {
	return userSchema.parse({
		id: 12,
		first_name: 'Jan',
		last_name: 'Kowalski',
		full_name: 'Jan Kowalski',
		login: 'Jkowal',
		role: 'worker',
		is_active: true,
		created_at: '2026-10-28T06:00:00Z',
		...overrides,
	});
}
