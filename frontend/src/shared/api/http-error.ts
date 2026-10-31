import { apiErrorSchema } from './api-error.schemas';

export type FieldErrors = Record<string, string[]>;

export type HttpErrorDetails = {
	status: number;
	code: string;
	message: string;
	fieldErrors?: FieldErrors | undefined;
};

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
export const INVALID_RESPONSE_CODE = 'INVALID_RESPONSE';
export const SERVER_ERROR_CODE = 'SERVER_ERROR';

const FALLBACK_SERVER_MESSAGE =
	'Coś poszło nie tak. Spróbuj ponownie za chwilę.';

/**
 * Error thrown by the HTTP client for every failed request.
 *
 * `code` is a contract error code or a local one (`NETWORK_ERROR`, `INVALID_RESPONSE`);
 * `status` is `0` when no response was received.
 */
export class HttpError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fieldErrors: FieldErrors;

	constructor({ status, code, message, fieldErrors = {} }: HttpErrorDetails) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
		this.code = code;
		this.fieldErrors = fieldErrors;
	}
}

/**
 * Builds an `HttpError` from a response body.
 *
 * Bodies that do not match the API error envelope (e.g. an HTML page from a proxy)
 * yield code `SERVER_ERROR` with a generic message.
 */
export function parseApiError(status: number, body: unknown): HttpError {
	const parsed = apiErrorSchema.safeParse(body);
	if (!parsed.success) {
		return new HttpError({
			status,
			code: SERVER_ERROR_CODE,
			message: FALLBACK_SERVER_MESSAGE,
		});
	}
	return new HttpError({
		status,
		code: parsed.data.code,
		message: parsed.data.message,
		fieldErrors: parsed.data.errors,
	});
}
