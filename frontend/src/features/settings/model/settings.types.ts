import type { z } from 'zod';
import type {
	breakWindowSchema,
	publicSettingsSchema,
} from './settings.schemas';

export type BreakWindow = z.infer<typeof breakWindowSchema>;

export type PublicSettings = z.infer<typeof publicSettingsSchema>;
