import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { server } from './msw/server';

beforeAll(() => {
	server.listen({ onUnhandledFrame: 'error' });
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(async () => {
	cleanup();
	await i18n.changeLanguage('pl');
	server.resetHandlers();
	vi.useRealTimers();
});

afterAll(() => server.close());
