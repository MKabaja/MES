import type { ZodType } from 'zod';
import {
	API_BASE,
	CSRF_COOKIE_PATH,
	getUiLanguage,
} from '@/shared/config/app.config';
import { assertNoPathTraversal } from './api-path';
import {
	hasLoadedCsrfCookie,
	markCsrfCookieLoaded,
	readXsrfToken,
} from './csrf';
import {
	HttpError,
	INVALID_RESPONSE_CODE,
	NETWORK_ERROR_CODE,
	parseApiError,
} from './http-error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequestOptions<TResponse> = {
	method?: HttpMethod;
	body?: unknown;
	schema: ZodType<TResponse>;
	signal?: AbortSignal;
	headers?: Record<string, string>;
};

type UnauthorizedHandler = () => void;

const STATUS_NO_CONTENT = 204;
const STATUS_UNAUTHORIZED = 401;
const STATUS_CSRF_MISMATCH = 419;
const NETWORK_ERROR_MESSAGE = 'Brak połączenia z serwerem.';
const INVALID_RESPONSE_MESSAGE =
	'Coś poszło nie tak. Spróbuj ponownie za chwilę.';
const METHODS_REQUIRING_CSRF: ReadonlySet<HttpMethod> = new Set([
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
]);

const CLIENT_OWNED_HEADERS = [
	'Accept',
	'Accept-Language',
	'Content-Type',
	'X-XSRF-TOKEN',
] as const;

let handleUnauthorized: UnauthorizedHandler = () => {};
let pendingCsrfRequest: Promise<void> | null = null;

/**
 * Registers the callback run on every 401 response, before the `HttpError` is thrown.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
	handleUnauthorized = handler;
}

/**
 * Sends a JSON request to the API and returns the response validated by `schema`.
 *
 * Retries once after a `419` with a fresh CSRF cookie. A `204` response is validated as `undefined`.
 *
 * Headers set by the client (`Accept`, `Accept-Language`, `Content-Type`, `X-XSRF-TOKEN`) cannot be overridden through `options.headers`.
 *
 * @throws {@link RangeError} when `path` contains a `..` segment.
 * @throws {@link HttpError} for non-2xx responses, `NETWORK_ERROR` when no response arrived and `INVALID_RESPONSE` when the body does not match `schema`.
 */
export async function http<TResponse>(
	path: string,
	options: HttpRequestOptions<TResponse>,
): Promise<TResponse> {
	assertNoPathTraversal(path);
	let response = await sendRequest(path, options);
	if (response.status === STATUS_CSRF_MISMATCH) {
		await ensureCsrfCookie(true);
		response = await sendRequest(path, options);
	}
	if (!response.ok) {
		throw await buildHttpError(response);
	}
	return parseSuccessBody(response, options.schema);
}

/**
 * Fetches `GET /sanctum/csrf-cookie` once per tab session; `force` refetches it.
 */
export async function ensureCsrfCookie(force = false): Promise<void> {
	if (hasLoadedCsrfCookie() && !force) {
		return;
	}
	pendingCsrfRequest ??= requestCsrfCookie().finally(() => {
		pendingCsrfRequest = null;
	});
	await pendingCsrfRequest;
}

async function requestCsrfCookie(): Promise<void> {
	const response = await fetchOrThrowNetworkError(CSRF_COOKIE_PATH, {
		credentials: 'same-origin',
		headers: { Accept: 'application/json' },
	});
	if (!response.ok) {
		throw await buildHttpError(response);
	}
	markCsrfCookieLoaded();
}

async function sendRequest<TResponse>(
	path: string,
	{ method = 'GET', body, signal, headers }: HttpRequestOptions<TResponse>,
): Promise<Response> {
	return fetchOrThrowNetworkError(`${API_BASE}${path}`, {
		method,
		body: serializeBody(body),
		signal: signal ?? null,
		credentials: 'same-origin',
		headers: buildHeaders(method, body, headers),
	});
}

function buildHeaders(
	method: HttpMethod,
	body: unknown,
	extraHeaders: Record<string, string> = {},
): Headers {
	const headers = new Headers(extraHeaders);
	for (const name of CLIENT_OWNED_HEADERS) {
		headers.delete(name);
	}
	headers.set('Accept', 'application/json');
	headers.set('Accept-Language', getUiLanguage());
	if (body !== undefined && !(body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}
	const xsrfToken = readXsrfToken();
	if (METHODS_REQUIRING_CSRF.has(method) && xsrfToken !== null) {
		headers.set('X-XSRF-TOKEN', xsrfToken);
	}
	return headers;
}

function serializeBody(body: unknown): BodyInit | null {
	if (body === undefined) {
		return null;
	}
	return body instanceof FormData ? body : JSON.stringify(body);
}

async function fetchOrThrowNetworkError(
	url: string,
	init: RequestInit,
): Promise<Response> {
	try {
		return await fetch(url, init);
	} catch (error) {
		if (init.signal?.aborted) {
			throw error;
		}
		throw new HttpError({
			status: 0,
			code: NETWORK_ERROR_CODE,
			message: NETWORK_ERROR_MESSAGE,
		});
	}
}

async function buildHttpError(response: Response): Promise<HttpError> {
	if (response.status === STATUS_UNAUTHORIZED) {
		handleUnauthorized();
	}
	return parseApiError(response.status, await readJsonOrNull(response));
}

async function readJsonOrNull(response: Response): Promise<unknown> {
	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

async function parseSuccessBody<TResponse>(
	response: Response,
	schema: ZodType<TResponse>,
): Promise<TResponse> {
	const payload =
		response.status === STATUS_NO_CONTENT
			? undefined
			: await readJsonOrNull(response);
	const parsed = schema.safeParse(payload);
	if (!parsed.success) {
		throw new HttpError({
			status: response.status,
			code: INVALID_RESPONSE_CODE,
			message: INVALID_RESPONSE_MESSAGE,
		});
	}
	return parsed.data;
}
