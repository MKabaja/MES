import { apiErrorSchema } from './api-error.schemas';
import { HTTP_STATUS } from './http-status.constants';

export type FieldErrors = Record<string, string[]>;

export type HttpErrorDetails = {
	status: number;
	code: string;
	message: string;
	fieldErrors?: FieldErrors | undefined;
	retryAfterSeconds?: number | undefined;
};

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
export const INVALID_RESPONSE_CODE = 'INVALID_RESPONSE';
export const SERVER_ERROR_CODE = 'SERVER_ERROR';

const FORBIDDEN_CODE = 'FORBIDDEN';
const SESSION_REJECTION_CODES: ReadonlySet<string> = new Set([
	'ACCOUNT_INACTIVE',
	'NETWORK_NOT_ALLOWED',
]);

const WHOLE_SECONDS_PATTERN = /^\d+$/;

const FALLBACK_SERVER_MESSAGE =
	'Coś poszło nie tak. Spróbuj ponownie za chwilę.';

/**
 * Error thrown by the HTTP client for every failed request.
 *
 * `code` is a contract error code or a local one (`NETWORK_ERROR`, `INVALID_RESPONSE`);
 * `status` is `0` when no response was received; `retryAfterSeconds` is set only when the response carried a numeric `Retry-After` header.
 */
export class HttpError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fieldErrors: FieldErrors;
	readonly retryAfterSeconds: number | undefined;

	constructor({
		status,
		code,
		message,
		fieldErrors = {},
		retryAfterSeconds,
	}: HttpErrorDetails) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
		this.code = code;
		this.fieldErrors = fieldErrors;
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

/**
 * Builds an `HttpError` from a response body and the raw `Retry-After` header value.
 *
 * Bodies that do not match the API error envelope (e.g. an HTML page from a proxy)
 * yield code `SERVER_ERROR` with a generic message. Only a whole number of seconds is
 * accepted from the header; any other value (HTTP date, negative, garbage) is ignored.
 */
export function parseApiError(
	status: number,
	body: unknown,
	retryAfterHeader: string | null = null,
): HttpError {
	const retryAfterSeconds = parseRetryAfterSeconds(retryAfterHeader);
	const parsed = apiErrorSchema.safeParse(body);
	if (!parsed.success) {
		return new HttpError({
			status,
			code: SERVER_ERROR_CODE,
			message: FALLBACK_SERVER_MESSAGE,
			retryAfterSeconds,
		});
	}
	return new HttpError({
		status,
		code: parsed.data.code,
		message: parsed.data.message,
		fieldErrors: parsed.data.errors,
		retryAfterSeconds,
	});
}

/**
 * Tells whether `error` is a `403 FORBIDDEN`: the user is signed in but may not see the resource.
 */
export function isForbiddenError(error: unknown): error is HttpError {
	return (
		error instanceof HttpError &&
		error.status === HTTP_STATUS.forbidden &&
		error.code === FORBIDDEN_CODE
	);
}

/**
 * Tells whether `error` is a `403` that makes the whole session unusable (`ACCOUNT_INACTIVE`, `NETWORK_NOT_ALLOWED`).
 */
export function isSessionRejectedError(error: unknown): error is HttpError {
	return (
		error instanceof HttpError &&
		error.status === HTTP_STATUS.forbidden &&
		SESSION_REJECTION_CODES.has(error.code)
	);
}

function parseRetryAfterSeconds(header: string | null): number | undefined {
	const trimmed = header?.trim();
	if (!trimmed || !WHOLE_SECONDS_PATTERN.test(trimmed)) {
		return undefined;
	}
	const seconds = Number(trimmed);
	return Number.isSafeInteger(seconds) ? seconds : undefined;
}
