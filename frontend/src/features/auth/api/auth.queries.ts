import { queryOptions } from '@tanstack/react-query';
import { HttpError } from '@/shared/api/http-error';
import type { User } from '../model/auth.types';
import { fetchMe } from './auth.api';

const STATUS_UNAUTHORIZED = 401;

async function fetchMeOrNull(signal: AbortSignal): Promise<User | null> {
	try {
		return await fetchMe({ signal });
	} catch (error) {
		if (error instanceof HttpError && error.status === STATUS_UNAUTHORIZED) {
			return null;
		}
		throw error;
	}
}

/**
 * Query options for the session.
 *
 * `me` resolves to `null` (not an error) when there is no session and never goes stale on its own.
 */
export const authQueries = {
	all: () => ['auth'] as const,
	me: () =>
		queryOptions({
			queryKey: ['auth', 'me'] as const,
			queryFn: ({ signal }) => fetchMeOrNull(signal),
			staleTime: Number.POSITIVE_INFINITY,
		}),
};
