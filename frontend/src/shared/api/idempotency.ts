export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/**
 * Creates a new idempotency key; call at the moment of the user's intent and keep it until the action succeeds or fails with a 4xx.
 */
export function createIdempotencyKey(): string {
	return crypto.randomUUID();
}

/**
 * Returns request headers carrying the given idempotency key.
 */
export function idempotencyHeaders(key: string): Record<string, string> {
	return { [IDEMPOTENCY_KEY_HEADER]: key };
}
