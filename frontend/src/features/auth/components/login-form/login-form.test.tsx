import { fireEvent, screen, waitFor } from '@testing-library/react';
import { delay, HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { buildUser } from '@/test/fixtures/user';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

type ErrorResponse = {
	status: number;
	code: string;
	message: string;
	headers?: Record<string, string>;
};

function failLoginWith({ status, code, message, headers }: ErrorResponse) {
	server.use(
		http.post('*/api/v1/auth/login', () =>
			HttpResponse.json({ message, code }, { status, headers: headers ?? {} }),
		),
	);
}

async function setup(route = '/login') {
	const rendered = await renderWithProviders(undefined, { route });
	await screen.findByRole('heading', { name: 'Zaloguj się' });
	return rendered;
}

async function submitCredentials(
	user: Awaited<ReturnType<typeof setup>>['user'],
) {
	await user.type(screen.getByLabelText('Login'), 'Jkowal');
	await user.type(screen.getByLabelText('Hasło'), '1234');
	await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
}

describe('login screen', () => {
	it('sends one request when the form is submitted twice in a row', async () => {
		const loginRequests = vi.fn();
		server.use(
			http.post('*/api/v1/auth/login', async () => {
				loginRequests();
				await delay(50);
				return HttpResponse.json({ data: buildUser() });
			}),
		);
		const { user, router } = await setup();
		await user.type(screen.getByLabelText('Login'), 'Jkowal');
		await user.type(screen.getByLabelText('Hasło'), '1234');
		const submitButton = screen.getByRole('button', { name: 'Zaloguj się' });

		fireEvent.click(submitButton);
		fireEvent.click(submitButton);

		await waitFor(() => expect(router.state.location.pathname).toBe('/hala'));
		expect(loginRequests).toHaveBeenCalledTimes(1);
	});

	it('sends the user to the redirect path after signing in', async () => {
		const { user, router } = await setup(
			'/login?redirect=%2Fzlecenia%3Fpage%3D2',
		);

		await submitCredentials(user);

		await waitFor(() =>
			expect(router.state.location.href).toBe('/zlecenia?page=2'),
		);
	});

	it('sends the user to the home page of the role when there is no redirect', async () => {
		const { user, router } = await setup();

		await submitCredentials(user);

		await waitFor(() => expect(router.state.location.pathname).toBe('/hala'));
		expect(router.state.location.search).toEqual({});
	});

	it.each([
		['absolute URL', 'https://evil.example'],
		['protocol-relative URL', '//evil.example'],
	])('ignores a redirect to a %s', async (_label, redirect) => {
		const { user, router } = await setup(
			`/login?redirect=${encodeURIComponent(redirect)}`,
		);

		await submitCredentials(user);

		await waitFor(() => expect(router.state.location.pathname).toBe('/hala'));
		expect(router.state.location.search).toEqual({});
	});

	it('drops data cached for a previous user when signing in', async () => {
		const { user, queryClient } = await setup();
		queryClient.setQueryData(['hall', 'orders'], [{ id: 1 }]);

		await submitCredentials(user);

		await waitFor(() =>
			expect(queryClient.getQueryData(['hall', 'orders'])).toBeUndefined(),
		);
		expect(queryClient.getQueryData(['auth', 'me'])).toMatchObject({
			login: 'Jkowal',
		});
	});

	it('sends the login without surrounding spaces', async () => {
		const loginBodies = vi.fn();
		server.use(
			http.post('*/api/v1/auth/login', async ({ request }) => {
				loginBodies(await request.json());
				return HttpResponse.json({ data: buildUser() });
			}),
		);
		const { user } = await setup();

		await user.type(screen.getByLabelText('Login'), '  Jkowal ');
		await user.type(screen.getByLabelText('Hasło'), '1234');
		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		await waitFor(() =>
			expect(loginBodies).toHaveBeenCalledWith({
				login: 'Jkowal',
				password: '1234',
			}),
		);
	});

	it('asks for the missing fields without calling the API', async () => {
		const { user, router } = await setup();

		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		expect(await screen.findByText('Podaj login.')).toBeInTheDocument();
		expect(screen.getByText('Podaj hasło.')).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/login');
	});

	it('clears and hides the password after a failed sign-in', async () => {
		failLoginWith({
			status: 401,
			code: 'INVALID_CREDENTIALS',
			message: 'Nieprawidłowy login lub hasło.',
		});
		const { user } = await setup();
		await user.type(screen.getByLabelText('Login'), 'Jkowal');
		await user.type(screen.getByLabelText('Hasło'), '1234');
		await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));

		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		await screen.findByRole('alert');
		expect(screen.getByLabelText('Hasło')).toHaveValue('');
		expect(screen.getByLabelText('Hasło')).toHaveAttribute('type', 'password');
		expect(screen.getByLabelText('Login')).toHaveValue('Jkowal');
	});

	it('reveals the password on demand', async () => {
		const { user } = await setup();
		const password = screen.getByLabelText('Hasło');
		const toggle = screen.getByRole('button', { name: 'Pokaż hasło' });

		expect(password).toHaveAttribute('type', 'password');
		await user.click(toggle);

		expect(password).toHaveAttribute('type', 'text');
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
	});

	it('disables the button while signing in', async () => {
		server.use(
			http.post('*/api/v1/auth/login', async () => {
				await new Promise(() => {});
				return HttpResponse.json({});
			}),
		);
		const { user } = await setup();

		await submitCredentials(user);

		expect(
			await screen.findByRole('button', { name: 'Zaloguj się' }),
		).toBeDisabled();
	});

	it.each([
		{
			status: 422,
			code: 'INVALID_CREDENTIALS',
			message: 'Nieprawidłowy login lub hasło.',
		},
		{
			status: 403,
			code: 'ACCOUNT_INACTIVE',
			message: 'Konto jest nieaktywne.',
		},
		{
			status: 403,
			code: 'NETWORK_NOT_ALLOWED',
			message: 'Logowanie jest możliwe tylko z sieci zakładu.',
		},
	])(
		'shows the server message for $code under the button and marks both fields invalid',
		async (response) => {
			failLoginWith(response);
			const logoutRequests = vi.fn();
			server.use(
				http.post('*/api/v1/auth/logout', () => {
					logoutRequests();
					return new HttpResponse(null, { status: 204 });
				}),
			);
			const { user } = await setup();

			await submitCredentials(user);

			expect(await screen.findByRole('alert')).toHaveTextContent(
				response.message,
			);
			expect(logoutRequests).not.toHaveBeenCalled();
			expect(screen.getByLabelText('Login')).toBeInvalid();
			expect(screen.getByLabelText('Hasło')).toBeInvalid();
		},
	);

	it('clears the previous server error when the next submit fails local validation', async () => {
		failLoginWith({
			status: 422,
			code: 'INVALID_CREDENTIALS',
			message: 'Nieprawidłowy login lub hasło.',
		});
		const { user } = await setup();
		await submitCredentials(user);
		await screen.findByRole('alert');

		await user.clear(screen.getByLabelText('Login'));
		await user.type(screen.getByLabelText('Hasło'), '1234');
		await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

		expect(await screen.findByText('Podaj login.')).toBeInTheDocument();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Hasło')).toBeValid();
	});

	it.each([
		[
			'Retry-After: 600',
			{ 'Retry-After': '600' },
			'Za dużo prób, spróbuj za 10 min.',
		],
		[
			'Retry-After: 61',
			{ 'Retry-After': '61' },
			'Za dużo prób, spróbuj za 2 min.',
		],
		['no Retry-After', undefined, 'Za dużo prób, spróbuj za minutę.'],
		[
			'Retry-After: 30',
			{ 'Retry-After': '30' },
			'Za dużo prób, spróbuj za minutę.',
		],
	])('on 429 with %s says "%s"', async (_label, headers, expected) => {
		failLoginWith({
			status: 429,
			code: 'TOO_MANY_REQUESTS',
			message: 'Zbyt wiele żądań.',
			...(headers && { headers }),
		});
		const { user } = await setup();

		await submitCredentials(user);

		expect(await screen.findByRole('alert')).toHaveTextContent(expected);
	});
});
