import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { server } from '@/test/msw/server';
import { http } from './http';
import { createIdempotencyKey, idempotencyHeaders } from './idempotency';

describe('idempotency', () => {
	it('creates a distinct UUID for each intent', () => {
		const first = createIdempotencyKey();

		expect(first).toMatch(/^[0-9a-f-]{36}$/);
		expect(createIdempotencyKey()).not.toBe(first);
	});

	it('resends the same Idempotency-Key header after a network error', async () => {
		const keys: (string | null)[] = [];
		let isFirstAttempt = true;
		server.use(
			mswHttp.post('*/api/v1/work/start', ({ request }) => {
				keys.push(request.headers.get('Idempotency-Key'));
				if (isFirstAttempt) {
					isFirstAttempt = false;
					return HttpResponse.error();
				}
				return HttpResponse.json({ data: null });
			}),
		);
		const headers = idempotencyHeaders(createIdempotencyKey());
		const schema = z.object({ data: z.null() });

		await expect(
			http('/work/start', { method: 'POST', schema, headers }),
		).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
		await http('/work/start', { method: 'POST', schema, headers });

		expect(keys).toHaveLength(2);
		expect(keys[0]).not.toBeNull();
		expect(keys[1]).toBe(keys[0]);
	});
});
