import { publicSettingsSchema } from '@/features/settings/model/settings.schemas';
import type { PublicSettings } from '@/features/settings/model/settings.types';

/**
 * Builds contract-valid public settings; throws when the overrides break the schema.
 */
export function buildPublicSettings(
	overrides: Partial<PublicSettings> = {},
): PublicSettings {
	return publicSettingsSchema.parse({
		shift_start: '06:00',
		shift_end: '14:00',
		breaks: [{ start: '10:00', end: '10:15' }],
		worker_backdate_days: 2,
		station_idle_logout_minutes: 5,
		...overrides,
	});
}
