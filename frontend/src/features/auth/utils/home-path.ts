import type { Role } from '../model/auth.types';

export type HomePath = '/panel' | '/hala';

type HomePathByRole = Record<Role, HomePath>;

const homePathByRole: HomePathByRole = {
	admin: '/panel',
	worker: '/hala',
};

/**
 * Returns the landing path of a role: `/panel` for the office, `/hala` for the hall.
 */
export function getHomePath(role: Role): HomePath {
	return homePathByRole[role];
}
