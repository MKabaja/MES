import { z } from 'zod';

export const apiErrorSchema = z.object({
	message: z.string(),
	code: z.string(),
	errors: z.record(z.string(), z.array(z.string())).optional(),
});
