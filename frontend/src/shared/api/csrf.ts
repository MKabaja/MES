const XSRF_COOKIE_NAME = 'XSRF-TOKEN';

let isCsrfCookieLoaded = false;

/**
 * Reads the decoded CSRF token from the `XSRF-TOKEN` cookie, or `null` when absent or malformed.
 */
export function readXsrfToken(): string | null {
	const entry = document.cookie
		.split('; ')
		.find((cookie) => cookie.startsWith(`${XSRF_COOKIE_NAME}=`));
	if (entry === undefined) {
		return null;
	}
	try {
		return decodeURIComponent(entry.slice(XSRF_COOKIE_NAME.length + 1));
	} catch {
		return null;
	}
}

/**
 * Tells whether the CSRF cookie was already fetched in this tab session.
 */
export function hasLoadedCsrfCookie(): boolean {
	return isCsrfCookieLoaded;
}

/**
 * Records that the CSRF cookie was fetched successfully.
 */
export function markCsrfCookieLoaded(): void {
	isCsrfCookieLoaded = true;
}

/**
 * Forgets that the CSRF cookie was fetched; call after logout so the next login fetches a fresh one.
 */
export function resetCsrfCookie(): void {
	isCsrfCookieLoaded = false;
}
