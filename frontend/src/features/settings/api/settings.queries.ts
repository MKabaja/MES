import { queryOptions } from '@tanstack/react-query';
import { fetchPublicSettings } from './settings.api';

/**
 * Query options for settings; `public` is readable by every signed-in role.
 */
export const settingsQueries = {
	all: () => ['settings'] as const,
	public: () =>
		queryOptions({
			queryKey: ['settings', 'public'] as const,
			queryFn: ({ signal }) => fetchPublicSettings({ signal }),
		}),
};
