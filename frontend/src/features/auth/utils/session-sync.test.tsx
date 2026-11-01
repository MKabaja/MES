import { act, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

const SIGNED_IN_USER_ID = buildUser().id;

function openOtherTab() {
	const channel = new BroadcastChannel('mes-session');
	const receivedMessages = vi.fn();
	channel.addEventListener('message', (event) => receivedMessages(event.data));
	return { channel, receivedMessages };
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

function returnToTab() {
	act(() => {
		document.dispatchEvent(new Event('visibilitychange'));
	});
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
			const { channel } = openOtherTab();

			channel.postMessage(message);

			expect(
				await screen.findByRole('heading', { name: 'Zaloguj się' }),
			).toBeInTheDocument();
			expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
			expect(logoutRequests).not.toHaveBeenCalled();
		},
	);

	it('ignores a sign-in of the same user and malformed messages from another tab', async () => {
		await renderHall();
		const { channel } = openOtherTab();

		channel.postMessage({ type: 'signedIn', userId: SIGNED_IN_USER_ID });
		channel.postMessage({ type: 'signedOut' });
		await act(() => Promise.resolve());

		expect(screen.getByRole('heading', { name: 'Hala' })).toBeInTheDocument();
	});

	it('tells other tabs when the server confirmed the logout', async () => {
		const { user } = await renderHall();
		const { receivedMessages } = openOtherTab();

		await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

		await waitFor(() =>
			expect(receivedMessages).toHaveBeenCalledWith({ type: 'ended' }),
		);
	});

	it('tells other tabs who signed in', async () => {
		answerMeWith(() =>
			HttpResponse.json(
				{ message: 'Brak aktywnej sesji.', code: 'UNAUTHENTICATED' },
				{ status: 401 },
			),
		);
		const { user } = await renderWithProviders(undefined, { route: '/login' });
		const { receivedMessages } = openOtherTab();

		await user.type(await screen.findByLabelText('Login'), 'Jkowal');
		await user.type(screen.getByLabelText('Hasło'), '1234');
		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		await waitFor(() =>
			expect(receivedMessages).toHaveBeenCalledWith({
				type: 'signedIn',
				userId: SIGNED_IN_USER_ID,
			}),
		);
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
			await renderHall();
			answerMeWith(response);

			returnToTab();

			expect(
				await screen.findByRole('heading', { name: 'Zaloguj się' }),
			).toBeInTheDocument();
			expect(logoutRequests).not.toHaveBeenCalled();
		},
	);

	it('stays on the page on return to the tab when the same user is signed in', async () => {
		await renderHall();
		const meRequests = vi.fn();
		answerMeWith(() => {
			meRequests();
			return HttpResponse.json({ data: buildUser() });
		});

		returnToTab();

		await waitFor(() => expect(meRequests).toHaveBeenCalledTimes(1));
		expect(screen.getByRole('heading', { name: 'Hala' })).toBeInTheDocument();
	});

	it('still checks the session on return to the tab without BroadcastChannel support', async () => {
		vi.stubGlobal('BroadcastChannel', undefined);
		await renderHall();
		answerMeWith(() => HttpResponse.json({ data: buildUser({ id: 99 }) }));

		returnToTab();

		expect(
			await screen.findByRole('heading', { name: 'Zaloguj się' }),
		).toBeInTheDocument();
	});
});
