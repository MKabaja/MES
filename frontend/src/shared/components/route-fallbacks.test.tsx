import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { http as apiHttp } from '@/shared/api/http';
import { server } from '@/test/msw/server';
import { RouteError, RoutePending } from './route-fallbacks';

const itemSchema = z.object({ title: z.string() });

function loadItem() {
	return apiHttp('/items', { schema: itemSchema });
}

const rootRoute = createRootRoute();
const itemRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	loader: loadItem,
	component: ItemPage,
});

function ItemPage() {
	return <h1>Zlecenie załadowane</h1>;
}

function renderFailingRoute() {
	const router = createRouter({
		routeTree: rootRoute.addChildren([itemRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		defaultErrorComponent: RouteError,
		defaultPendingMinMs: 0,
	});
	render(
		<QueryClientProvider client={new QueryClient()}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
}

describe('RouteError', () => {
	it('shows the loaded content after retrying a failed route load', async () => {
		const user = userEvent.setup();
		let shouldFail = true;
		server.use(
			http.get('*/api/v1/items', () =>
				shouldFail
					? new HttpResponse(null, { status: 500 })
					: HttpResponse.json({ title: 'Zlecenie ZP/1' }),
			),
		);
		renderFailingRoute();

		expect(await screen.findByRole('alert')).toBeInTheDocument();
		shouldFail = false;
		await user.click(screen.getByRole('button', { name: /spróbuj ponownie/i }));

		expect(
			await screen.findByRole('heading', { name: 'Zlecenie załadowane' }),
		).toBeInTheDocument();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});

describe('RoutePending', () => {
	it('exposes a status region', () => {
		render(<RoutePending />);

		expect(screen.getByRole('status')).toHaveTextContent(/ładowanie/i);
	});
});
