import { z } from 'zod';

export const paginationMetaSchema = z.object({
	current_page: z.int(),
	per_page: z.int(),
	total: z.int(),
	last_page: z.int(),
});

/**
 * Builds the schema of a paginated list response: `{ data: item[], meta }`.
 */
export function paginated<TItem extends z.ZodType>(itemSchema: TItem) {
	return z.object({
		data: z.array(itemSchema),
		meta: paginationMetaSchema,
	});
}
