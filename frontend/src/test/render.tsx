import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { type RenderResult, render } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { createAppRouter } from '@/router';
import { i18n } from '@/shared/i18n/i18n';

export type RenderWithProvidersOptions = { route?: string };

export type RenderWithProvidersResult = RenderResult & {
	user: UserEvent;
	queryClient: QueryClient;
	router: ReturnType<typeof createAppRouter>;
};

/**
 * Renders the app routes at `route` with a fresh `QueryClient` (no retries) and memory history.
 * Awaits the first route load and returns a ready `userEvent` instance.
 */
export async function renderWithProviders({
	route = '/',
}: RenderWithProvidersOptions = {}): Promise<RenderWithProvidersResult> {
	await i18n.changeLanguage('pl');
	const user = userEvent.setup();
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	const router = createAppRouter({
		queryClient,
		history: createMemoryHistory({ initialEntries: [route] }),
	});
	await router.load();
	const result = render(
		<I18nextProvider i18n={i18n}>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</I18nextProvider>,
	);
	return { user, queryClient, router, ...result };
}
