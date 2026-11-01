import { HttpResponse, http } from 'msw';
import { buildUser } from '../../fixtures/user';

export const authHandlers = [
	http.post('*/api/v1/auth/login', () =>
		HttpResponse.json({ data: buildUser() }),
	),
	http.post(
		'*/api/v1/auth/logout',
		() => new HttpResponse(null, { status: 204 }),
	),
	http.get('*/api/v1/auth/me', () => HttpResponse.json({ data: buildUser() })),
];
