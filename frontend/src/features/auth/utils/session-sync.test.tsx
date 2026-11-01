import type { QueryClient } from '@tanstack/react-query';
import { act, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { authQueries } from '../api/auth.queries';

const SIGNED_IN_USER_ID = buildUser().id;

function openOtherTab() {
	return new BroadcastChannel('mes-session');
}

function receiveNextMessage(channel: BroadcastChannel): Promise<unknown> {
	return new Promise((resolve) => {
		channel.addEventListener('message', (event) => resolve(event.data), {
			once: true,
		});
	});
}

function receiveMessageOfType(
	channel: BroadcastChannel,
	type: string,
): Promise<void> {
	return new Promise((resolve) => {
		channel.addEventListener('message', (event) => {
			if (event.data?.type === type) {
				resolve();
			}
		});
	});
}

function recordLogoutRequests() {
	const logoutRequests = vi.fn();
	server.use(
		http.post('*/api/v1/auth/logout', () => {
			logoutRequests();
			return new HttpResponse(null, { status: 204 });
		}),
	);
	return logoutRequests;
}

function answerMeWith(response: () => Response) {
	server.use(http.get('*/api/v1/auth/me', response));
}

async function renderHall() {
	const rendered = await renderWithProviders(undefined, { route: '/hala' });
	await screen.findByRole('heading', { name: 'Hala' });
	return rendered;
}

async function returnToTab(queryClient: QueryClient) {
	act(() => {
		document.dispatchEvent(new Event('visibilitychange'));
	});
	expect(queryClient.isFetching({ queryKey: authQueries.me().queryKey })).toBe(
		1,
	);
	await act(() =>
		queryClient
			.fetchQuery({ ...authQueries.me(), staleTime: 0 })
			.catch(() => null),
	);
}

describe('session sync between tabs', () => {
	it.each([
		{ reason: 'the session ended', message: { type: 'ended' } },
		{
			reason: 'another user signed in',
			message: { type: 'signedIn', userId: SIGNED_IN_USER_ID + 1 },
		},
	])(
		'leaves for the login screen without a logout request when $reason in another tab',
		async ({ message }) => {
			const logoutRequests = recordLogoutRequests();
			const { queryClient } = await renderHall();
			const channel = openOtherTab();

			channel.postMessage(message);

			expect(
				await screen.findByRole('heading', { name: 'Zaloguj się' }),
			).toBeInTheDocument();
			expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
			expect(logoutRequests).not.toHaveBeenCalled();
		},
	);

	it('ignores a sign-in of the same user and malformed messages from another tab', async () => {
		const { queryClient } = await renderHall();
		const channel = openOtherTab();
		const lastMessage = receiveMessageOfType(openOtherTab(), 'probe');

		channel.postMessage({ type: 'signedIn', userId: SIGNED_IN_USER_ID });
		channel.postMessage({ type: 'signedOut' });
		channel.postMessage({ type: 'probe' });
		await act(async () => {
			await lastMessage;
		});

		expect(queryClient.getQueryData(authQueries.me().queryKey)).toEqual(
			buildUser(),
		);
		expect(screen.getByRole('heading', { name: 'Hala' })).toBeInTheDocument();
	});

	it('tells other tabs when the server confirmed the logout', async () => {
		const { user } = await renderHall();
		const nextMessage = receiveNextMessage(openOtherTab());

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		await expect(nextMessage).resolves.toEqual({ type: 'ended' });
	});

	it('tells other tabs who signed in', async () => {
		answerMeWith(() =>
			HttpResponse.json(
				{ message: 'Brak aktywnej sesji.', code: 'UNAUTHENTICATED' },
				{ status: 401 },
			),
		);
		const { user } = await renderWithProviders(undefined, { route: '/login' });
		const nextMessage = receiveNextMessage(openOtherTab());

		await user.type(await screen.findByLabelText('Login'), 'Jkowal');
		await user.type(screen.getByLabelText('Hasło'), '1234');
		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		await expect(nextMessage).resolves.toEqual({
			type: 'signedIn',
			userId: SIGNED_IN_USER_ID,
		});
	});

	it.each([
		{
			reason: 'the session is gone',
			response: () =>
				HttpResponse.json(
					{ message: 'Brak aktywnej sesji.', code: 'UNAUTHENTICATED' },
					{ status: 401 },
				),
		},
		{
			reason: 'another user signed in meanwhile',
			response: () =>
				HttpResponse.json({ data: buildUser({ id: SIGNED_IN_USER_ID + 1 }) }),
		},
	])(
		'leaves for the login screen on return to the tab when $reason',
		async ({ response }) => {
			const logoutRequests = recordLogoutRequests();
			const { queryClient } = await renderHall();
			answerMeWith(response);

			await returnToTab(queryClient);

			expect(
				await screen.findByRole('heading', { name: 'Zaloguj się' }),
			).toBeInTheDocument();
			expect(logoutRequests).not.toHaveBeenCalled();
		},
	);

	it('stays on the page on return to the tab when the same user is signed in', async () => {
		const { queryClient } = await renderHall();
		const meRequests = vi.fn();
		answerMeWith(() => {
			meRequests();
			return HttpResponse.json({ data: buildUser() });
		});

		await returnToTab(queryClient);

		expect(meRequests).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('heading', { name: 'Hala' })).toBeInTheDocument();
	});

	it('still checks the session on return to the tab without BroadcastChannel support', async () => {
		vi.stubGlobal('BroadcastChannel', undefined);
		const { queryClient } = await renderHall();
		answerMeWith(() => HttpResponse.json({ data: buildUser({ id: 99 }) }));

		await returnToTab(queryClient);

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
	});
});
