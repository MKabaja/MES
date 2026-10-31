import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { http as httpClient } from '@/shared/api/http';
import { RoutePending } from '@/shared/components/route-fallbacks';
import { server } from '@/test/msw/server';
import { changeUiLanguage } from './i18n';

function stubStorage(
	initial: Record<string, string> = {},
): Map<string, string> {
	const items = new Map(Object.entries(initial));
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => {
			items.set(key, value);
		},
	});
	return items;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('changeUiLanguage', () => {
	it('changes rendered text', async () => {
		render(<RoutePending />);
		expect(screen.getByRole('status')).toHaveTextContent('Ładowanie…');

		await changeUiLanguage('en');

		expect(await screen.findByText('Loading…')).toBeInTheDocument();
	});

	it('updates the document language', async () => {
		await changeUiLanguage('en');

		expect(document.documentElement.lang).toBe('en');
	});

	it('sends the new language as Accept-Language', async () => {
		let acceptLanguage: string | null = null;
		server.use(
			http.get('/api/v1/ping', ({ request: incoming }) => {
				acceptLanguage = incoming.headers.get('Accept-Language');
				return HttpResponse.json({});
			}),
		);
		await changeUiLanguage('en');

		await httpClient('/ping', { schema: z.object({}) });

		expect(acceptLanguage).toBe('en');
	});

	it('saves the choice in storage', async () => {
		const items = stubStorage();

		await changeUiLanguage('en');

		expect(items.get('mes.uiLanguage')).toBe('"en"');
	});
});

describe('initial language', () => {
	async function loadFreshI18n(stored: string | null) {
		vi.resetModules();
		stubStorage(stored === null ? {} : { 'mes.uiLanguage': stored });
		return (await import('./i18n')).i18n;
	}

	it('uses the stored language', async () => {
		const fresh = await loadFreshI18n('"en"');

		expect(fresh.resolvedLanguage).toBe('en');
	});

	it('defaults to Polish when nothing is stored', async () => {
		const fresh = await loadFreshI18n(null);

		expect(fresh.resolvedLanguage).toBe('pl');
	});

	it.each(['"de"', '{not json', '1'])(
		'defaults to Polish for corrupted value %s',
		async (stored) => {
			const fresh = await loadFreshI18n(stored);

			expect(fresh.resolvedLanguage).toBe('pl');
		},
	);
});
