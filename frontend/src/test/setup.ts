import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

beforeAll(() => {
	server.listen({ onUnhandledFrame: 'error' });
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	cleanup();
	server.resetHandlers();
	vi.useRealTimers();
});

afterAll(() => server.close());
