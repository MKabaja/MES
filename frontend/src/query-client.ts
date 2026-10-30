import { QueryClient } from '@tanstack/react-query';
import { HttpError, NETWORK_ERROR_CODE } from '@/shared/api/http-error';

const MAX_QUERY_RETRIES = 1;

function isRetryableError(error: unknown): boolean {
	if (!(error instanceof HttpError)) {
		return false;
	}
	return error.code === NETWORK_ERROR_CODE || error.status >= 500;
}

/**
 * Retries a failed query once, and only after a network failure or a 5xx response.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
	return failureCount < MAX_QUERY_RETRIES && isRetryableError(error);
}

/**
 * Creates a `QueryClient` with the application defaults.
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: 30_000, retry: shouldRetryQuery },
			mutations: { retry: 0 },
		},
	});
}

/**
 * Shared `QueryClient` instance used by the application.
 */
export const queryClient = createQueryClient();
