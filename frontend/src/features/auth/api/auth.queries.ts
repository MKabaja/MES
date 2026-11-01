import { queryOptions } from '@tanstack/react-query';
import { HttpError } from '@/shared/api/http-error';
import { HTTP_STATUS } from '@/shared/api/http-status.constants';
import { config } from '@/shared/config/app.config';
import type { User } from '../model/auth.types';
import { fetchMe } from './auth.api';

async function fetchMeOrNull(signal: AbortSignal): Promise<User | null> {
	try {
		return await fetchMe({ signal });
	} catch (error) {
		if (
			error instanceof HttpError &&
			error.status === HTTP_STATUS.unauthorized
		) {
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
			staleTime: config.queries.sessionStaleTimeMilliseconds,
		}),
};
