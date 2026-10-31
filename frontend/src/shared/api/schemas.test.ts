import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { paginated } from './pagination.schemas';
import {
	idSchema,
	isoDateTimeSchema,
	moneySchema,
	quantitySchema,
	scanCodeSchema,
} from './primitives.schemas';

describe('primitive schemas', () => {
	it.each([
		[
			moneySchema,
			['150.00', '-3.50', '0.00'],
			['150', '150.0', '1.234', '1,00'],
		],
		[quantitySchema, ['26.000', '-0.500'], ['26', '26.00', '26.0000']],
		[scanCodeSchema, ['104237', '000001'], ['12345', '1234567', '12345a']],
		[
			isoDateTimeSchema,
			['2026-10-28T06:15:00Z'],
			['2026-10-28', '2026-10-28T06:15:00+02:00'],
		],
		[idSchema, [42], [1.5, '42']],
	])('accepts valid and rejects invalid values', (schema, valid, invalid) => {
		for (const value of valid) {
			expect(schema.safeParse(value).success).toBe(true);
		}
		for (const value of invalid) {
			expect(schema.safeParse(value).success).toBe(false);
		}
	});
});

describe('paginated', () => {
	const schema = paginated(z.object({ id: idSchema }));

	it('parses items with pagination meta', () => {
		const body = {
			data: [{ id: 1 }],
			meta: { current_page: 1, per_page: 25, total: 1, last_page: 1 },
		};

		expect(schema.parse(body)).toEqual(body);
	});

	it('rejects a response without meta', () => {
		expect(schema.safeParse({ data: [] }).success).toBe(false);
	});
});
