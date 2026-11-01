import { http } from '@/shared/api/http';
import { publicSettingsResponseSchema } from '../model/settings.schemas';
import type { PublicSettings } from '../model/settings.types';

/**
 * Fetches the settings the hall needs (shift hours, breaks, backdating limit, idle logout time).
 */
export async function fetchPublicSettings({
	signal,
}: {
	signal?: AbortSignal;
} = {}): Promise<PublicSettings> {
	const response = await http('/settings/public', {
		schema: publicSettingsResponseSchema,
		...(signal && { signal }),
	});
	return response.data;
}
