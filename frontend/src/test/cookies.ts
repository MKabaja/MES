import { vi } from 'vitest';

/**
 * Makes `document.cookie` read as the given cookie string until mocks are restored.
 */
export function mockCookies(cookieString: string): void {
	vi.spyOn(document, 'cookie', 'get').mockReturnValue(cookieString);
}
