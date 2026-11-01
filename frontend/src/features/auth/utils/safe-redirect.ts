export const DEFAULT_REDIRECT_PATH = '/';

const FIRST_PRINTABLE_CHAR_CODE = 0x20;
const DELETE_CHAR_CODE = 0x7f;

/**
 * Returns `redirect` when it is a same-origin relative path, otherwise `/`.
 *
 * Accepts only values starting with a single `/`; rejects `//host`, backslashes, schemes and
 * control characters (browsers strip tabs and newlines, so `/\t/host` would become `//host`).
 */
export function getSafeRedirectPath(redirect: string | undefined): string {
	if (redirect === undefined || !isSameOriginPath(redirect)) {
		return DEFAULT_REDIRECT_PATH;
	}
	return redirect;
}

function isSameOriginPath(value: string): boolean {
	return (
		value.startsWith('/') &&
		!value.startsWith('//') &&
		!value.includes('\\') &&
		!hasControlCharacter(value)
	);
}

function hasControlCharacter(value: string): boolean {
	return Array.from(value).some((character) => {
		const code = character.charCodeAt(0);
		return code < FIRST_PRINTABLE_CHAR_CODE || code === DELETE_CHAR_CODE;
	});
}
