import { HttpResponse, http } from 'msw';
import { buildPublicSettings } from '../../fixtures/settings';

export const settingsHandlers = [
	http.get('*/api/v1/settings/public', () =>
		HttpResponse.json({ data: buildPublicSettings() }),
	),
];
