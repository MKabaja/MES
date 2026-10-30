import type { errors as polishErrors } from '../pl/errors';

export const errors: typeof polishErrors = {
	NETWORK_ERROR: 'Cannot reach the server.',
	INVALID_RESPONSE: 'Something went wrong. Please try again shortly.',
};
