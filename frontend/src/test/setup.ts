import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { removeSessionStorage } from '@/shared/lib/storage';
import {
	closeFakeBroadcastChannels,
	FakeBroadcastChannel,
} from './broadcast-channel';
import { server } from './msw/server';

beforeAll(() => {
	server.listen({ onUnhandledFrame: 'error' });
	vi.stubGlobal('scrollTo', vi.fn());
	vi.stubGlobal('matchMedia', () => ({
		matches: false,
		addEventListener: () => {},
		removeEventListener: () => {},
	}));
});

beforeEach(() => {
	removeSessionStorage('mes.pendingLogout');
	closeFakeBroadcastChannels();
	vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
});

afterEach(async () => {
	cleanup();
	await i18n.changeLanguage('pl');
	server.resetHandlers();
	vi.useRealTimers();
});

afterAll(() => server.close());
