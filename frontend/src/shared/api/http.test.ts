import { delay, HttpResponse, http as mswHttp } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { mockCookies } from '@/test/cookies';
import { server } from '@/test/msw/server';
import { setUiLanguageReader } from '../config/app.config';
import { markCsrfCookieLoaded, resetCsrfCookie } from './csrf';
import { ensureCsrfCookie, http, setUnauthorizedHandler } from './http';
import { HttpError } from './http-error';
import { idempotencyHeaders } from './idempotency';

const itemSchema = z.object({ data: z.object({ id: z.number() }) });

async function captureError(request: Promise<unknown>): Promise<HttpError> {
	try {
		await request;
	} catch (error) {
		if (error instanceof HttpError) {
			return error;
		}
		throw error;
	}
	throw new Error('Expected the request to fail');
}

beforeEach(() => {
	resetCsrfCookie();
	setUnauthorizedHandler(() => {});
	setUiLanguageReader(() => 'pl');
});

describe('http', () => {
	it('returns the body validated by the schema', async () => {
		server.use(
			mswHttp.get('*/api/v1/items/1', () =>
				HttpResponse.json({ data: { id: 1 } }),
			),
		);

		const result = await http('/items/1', { schema: itemSchema });

		expect(result).toEqual({ data: { id: 1 } });
	});

	it('returns undefined for a 204 response', async () => {
		server.use(
			mswHttp.post(
				'*/api/v1/auth/logout',
				() => new HttpResponse(null, { status: 204 }),
			),
		);

		const result = await http('/auth/logout', {
			method: 'POST',
			schema: z.undefined(),
		});

		expect(result).toBeUndefined();
	});

	it('sends Accept and Accept-Language headers and a JSON body', async () => {
		const received = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/items', async ({ request }) => {
				received({
					accept: request.headers.get('Accept'),
					language: request.headers.get('Accept-Language'),
					contentType: request.headers.get('Content-Type'),
					body: await request.json(),
				});
				return HttpResponse.json({ data: { id: 1 } });
			}),
		);
		setUiLanguageReader(() => 'en');

		await http('/items', {
			method: 'POST',
			body: { name: 'A' },
			schema: itemSchema,
		});

		expect(received).toHaveBeenCalledWith({
			accept: 'application/json',
			language: 'en',
			contentType: 'application/json',
			body: { name: 'A' },
		});
	});

	it('does not set Content-Type for FormData bodies', async () => {
		const contentType = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/upload', ({ request }) => {
				contentType(request.headers.get('Content-Type'));
				return HttpResponse.json({ data: { id: 1 } });
			}),
		);

		await http('/upload', {
			method: 'POST',
			body: new FormData(),
			schema: itemSchema,
		});

		expect(contentType).toHaveBeenCalledOnce();
		expect(contentType.mock.calls[0]?.[0]).toMatch(/^multipart\/form-data/);
	});

	it('forwards custom headers such as the idempotency key', async () => {
		const received = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/work/start', ({ request }) => {
				received(request.headers.get('Idempotency-Key'));
				return HttpResponse.json({ data: { id: 1 } });
			}),
		);

		await http('/work/start', {
			method: 'POST',
			schema: itemSchema,
			headers: idempotencyHeaders('key-1'),
		});

		expect(received).toHaveBeenCalledWith('key-1');
	});

	it('does not let caller headers override client-owned headers', async () => {
		mockCookies('XSRF-TOKEN=real');
		const received = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/items', ({ request }) => {
				received({
					token: request.headers.get('X-XSRF-TOKEN'),
					accept: request.headers.get('Accept'),
					language: request.headers.get('Accept-Language'),
				});
				return HttpResponse.json({ data: { id: 1 } });
			}),
		);

		await http('/items', {
			method: 'POST',
			schema: itemSchema,
			headers: {
				'x-xsrf-token': 'forged',
				accept: 'text/html',
				'Accept-Language': 'xx',
			},
		});

		expect(received).toHaveBeenCalledWith({
			token: 'real',
			accept: 'application/json',
			language: 'pl',
		});
	});

	it('drops a forged X-XSRF-TOKEN when no cookie token exists', async () => {
		const received = vi.fn();
		server.use(
			mswHttp.post('*/api/v1/items', ({ request }) => {
				received(request.headers.get('X-XSRF-TOKEN'));
				return HttpResponse.json({ data: { id: 1 } });
			}),
		);

		await http('/items', {
			method: 'POST',
			schema: itemSchema,
			headers: { 'X-XSRF-TOKEN': 'forged' },
		});

		expect(received).toHaveBeenCalledWith(null);
	});

	describe('path validation', () => {
		it.each([
			'/items/../admin',
			'/items/..',
			'/items/%2e%2e/admin',
			'/items/..%2Fadmin',
			'/items/..%5Cadmin',
		])('rejects %s without sending a request', async (path) => {
			const requested = vi.fn();
			server.use(
				mswHttp.all('*', () => {
					requested();
					return HttpResponse.json({ data: { id: 1 } });
				}),
			);

			await expect(http(path, { schema: itemSchema })).rejects.toThrow(
				RangeError,
			);
			expect(requested).not.toHaveBeenCalled();
		});

		it('allows dots inside a segment', async () => {
			server.use(
				mswHttp.get('*/api/v1/files/a..b', () =>
					HttpResponse.json({ data: { id: 1 } }),
				),
			);

			const result = await http('/files/a..b', { schema: itemSchema });

			expect(result).toEqual({ data: { id: 1 } });
		});
	});

	describe('X-XSRF-TOKEN header', () => {
		it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
			'is sent with the decoded cookie value on %s',
			async (method) => {
				mockCookies('XSRF-TOKEN=abc%3D%3D');
				const received = vi.fn();
				server.use(
					mswHttp.all('*/api/v1/items', ({ request }) => {
						received(request.method, request.headers.get('X-XSRF-TOKEN'));
						return HttpResponse.json({ data: { id: 1 } });
					}),
				);

				await http('/items', { method, schema: itemSchema });

				expect(received).toHaveBeenCalledWith(method, 'abc==');
			},
		);

		it('is not sent on GET', async () => {
			mockCookies('XSRF-TOKEN=abc');
			const received = vi.fn();
			server.use(
				mswHttp.get('*/api/v1/items', ({ request }) => {
					received(request.headers.get('X-XSRF-TOKEN'));
					return HttpResponse.json({ data: { id: 1 } });
				}),
			);

			await http('/items', { schema: itemSchema });

			expect(received).toHaveBeenCalledWith(null);
		});
	});

	describe('when the CSRF token expired (419)', () => {
		it('refetches the cookie and repeats the request exactly once', async () => {
			mockCookies('XSRF-TOKEN=old');
			markCsrfCookieLoaded();
			const tokens: (string | null)[] = [];
			const csrfRequests = vi.fn();
			server.use(
				mswHttp.get('*/sanctum/csrf-cookie', () => {
					csrfRequests();
					mockCookies('XSRF-TOKEN=fresh');
					return new HttpResponse(null, { status: 204 });
				}),
				mswHttp.post('*/api/v1/items', ({ request }) => {
					const token = request.headers.get('X-XSRF-TOKEN');
					tokens.push(token);
					if (token === 'old') {
						return HttpResponse.json(
							{ message: 'Sesja wygasła', code: 'CSRF_MISMATCH' },
							{ status: 419 },
						);
					}
					return HttpResponse.json({ data: { id: 1 } });
				}),
			);

			const result = await http('/items', {
				method: 'POST',
				schema: itemSchema,
			});

			expect(result).toEqual({ data: { id: 1 } });
			expect(tokens).toEqual(['old', 'fresh']);
			expect(csrfRequests).toHaveBeenCalledOnce();
		});

		it('throws the second 419 without a third attempt', async () => {
			const attempts = vi.fn();
			server.use(
				mswHttp.get(
					'*/sanctum/csrf-cookie',
					() => new HttpResponse(null, { status: 204 }),
				),
				mswHttp.post('*/api/v1/items', () => {
					attempts();
					return HttpResponse.json(
						{ message: 'Sesja wygasła', code: 'CSRF_MISMATCH' },
						{ status: 419 },
					);
				}),
			);

			const error = await captureError(
				http('/items', { method: 'POST', schema: itemSchema }),
			);

			expect(error.code).toBe('CSRF_MISMATCH');
			expect(attempts).toHaveBeenCalledTimes(2);
		});
	});

	describe('errors', () => {
		it('maps the API error envelope to HttpError', async () => {
			server.use(
				mswHttp.post('*/api/v1/items', () =>
					HttpResponse.json(
						{
							message: 'Odcinek nachodzi',
							code: 'SEGMENT_OVERLAP',
							errors: { started_at: ['Nachodzi na ZP/1'] },
						},
						{ status: 422 },
					),
				),
			);

			const error = await captureError(
				http('/items', { method: 'POST', schema: itemSchema }),
			);

			expect(error).toMatchObject({
				status: 422,
				code: 'SEGMENT_OVERLAP',
				message: 'Odcinek nachodzi',
				fieldErrors: { started_at: ['Nachodzi na ZP/1'] },
			});
		});

		it('maps an HTML error page to SERVER_ERROR', async () => {
			server.use(
				mswHttp.get(
					'*/api/v1/items',
					() =>
						new HttpResponse('<html>502 Bad Gateway</html>', {
							status: 502,
							headers: { 'Content-Type': 'text/html' },
						}),
				),
			);

			const error = await captureError(http('/items', { schema: itemSchema }));

			expect(error).toMatchObject({ status: 502, code: 'SERVER_ERROR' });
			expect(error.message).not.toContain('html');
		});

		it('calls onUnauthorized on 401 and still throws', async () => {
			const onUnauthorized = vi.fn();
			setUnauthorizedHandler(onUnauthorized);
			server.use(
				mswHttp.get('*/api/v1/items', () =>
					HttpResponse.json(
						{ message: 'Brak sesji', code: 'UNAUTHENTICATED' },
						{ status: 401 },
					),
				),
			);

			const error = await captureError(http('/items', { schema: itemSchema }));

			expect(onUnauthorized).toHaveBeenCalledOnce();
			expect(error.code).toBe('UNAUTHENTICATED');
		});

		it('does not call onUnauthorized for other statuses', async () => {
			const onUnauthorized = vi.fn();
			setUnauthorizedHandler(onUnauthorized);
			server.use(
				mswHttp.get('*/api/v1/items', () =>
					HttpResponse.json(
						{ message: 'Brak dostępu', code: 'FORBIDDEN' },
						{ status: 403 },
					),
				),
			);

			await captureError(http('/items', { schema: itemSchema }));

			expect(onUnauthorized).not.toHaveBeenCalled();
		});

		it('throws NETWORK_ERROR with status 0 when fetch fails', async () => {
			server.use(mswHttp.get('*/api/v1/items', () => HttpResponse.error()));

			const error = await captureError(http('/items', { schema: itemSchema }));

			expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
		});

		it('throws INVALID_RESPONSE when the body does not match the schema', async () => {
			server.use(
				mswHttp.get('*/api/v1/items', () =>
					HttpResponse.json({ data: { id: 'not-a-number' } }),
				),
			);

			const error = await captureError(http('/items', { schema: itemSchema }));

			expect(error).toMatchObject({ status: 200, code: 'INVALID_RESPONSE' });
		});

		it('throws INVALID_RESPONSE when a 200 body is not JSON', async () => {
			server.use(
				mswHttp.get(
					'*/api/v1/items',
					() => new HttpResponse('<html></html>', { status: 200 }),
				),
			);

			const error = await captureError(http('/items', { schema: itemSchema }));

			expect(error.code).toBe('INVALID_RESPONSE');
		});

		it('rethrows a body read failure instead of reporting INVALID_RESPONSE', async () => {
			server.use(
				mswHttp.get('*/api/v1/items', () =>
					HttpResponse.json({ data: { id: 1 } }),
				),
			);
			const readFailure = new Error('body stream aborted');
			vi.spyOn(Response.prototype, 'text').mockRejectedValue(readFailure);

			await expect(http('/items', { schema: itemSchema })).rejects.toBe(
				readFailure,
			);
		});

		it('rethrows an abort instead of reporting NETWORK_ERROR', async () => {
			server.use(
				mswHttp.get('*/api/v1/items', async () => {
					await delay(1000);
					return HttpResponse.json({ data: { id: 1 } });
				}),
			);
			const controller = new AbortController();

			const request = http('/items', {
				schema: itemSchema,
				signal: controller.signal,
			});
			controller.abort();

			await expect(request).rejects.not.toBeInstanceOf(HttpError);
		});
	});
});

describe('ensureCsrfCookie', () => {
	it('fetches the cookie only once unless forced', async () => {
		const csrfRequests = vi.fn();
		server.use(
			mswHttp.get('*/sanctum/csrf-cookie', () => {
				csrfRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await ensureCsrfCookie();
		await ensureCsrfCookie();
		await ensureCsrfCookie(true);

		expect(csrfRequests).toHaveBeenCalledTimes(2);
	});

	it('shares one request between concurrent calls', async () => {
		const csrfRequests = vi.fn();
		server.use(
			mswHttp.get('*/sanctum/csrf-cookie', () => {
				csrfRequests();
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await Promise.all([ensureCsrfCookie(true), ensureCsrfCookie(true)]);

		expect(csrfRequests).toHaveBeenCalledOnce();
	});
});
