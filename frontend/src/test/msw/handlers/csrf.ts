import { HttpResponse, http } from 'msw';

export const csrfHandlers = [
	http.get(
		'*/sanctum/csrf-cookie',
		() => new HttpResponse(null, { status: 204 }),
	),
];
