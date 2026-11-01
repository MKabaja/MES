import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderHookResult, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

export type RenderHookWithClientResult<TResult> = RenderHookResult<
	TResult,
	unknown
> & { queryClient: QueryClient };

/**
 * Renders a hook inside a `QueryClientProvider`; pass `queryClient` to pre-seed the cache, otherwise a fresh one without retries is used.
 */
export function renderHookWithClient<TResult>(
	hook: () => TResult,
	queryClient: QueryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	}),
): RenderHookWithClientResult<TResult> {
	const result = renderHook(hook, {
		wrapper: ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children),
	});
	return { queryClient, ...result };
}
