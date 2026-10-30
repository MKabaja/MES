const PATH_SEPARATORS = /[/\\]/;
const PARENT_SEGMENT = '..';

type PathParameter = string | number;

/**
 * Tagged template that builds an API path, encoding every interpolated value with `encodeURIComponent`.
 *
 * @example
 * apiPath`/scan/${code}`
 */
export function apiPath(
	strings: TemplateStringsArray,
	...parameters: PathParameter[]
): string {
	return parameters.reduce<string>(
		(path, parameter, index) =>
			`${path}${encodeURIComponent(parameter)}${strings[index + 1] ?? ''}`,
		strings[0] ?? '',
	);
}

/**
 * Throws when `path` contains a `..` segment, also in percent-encoded form.
 *
 * @throws {@link RangeError} for a path that could escape the API prefix.
 */
export function assertNoPathTraversal(path: string): void {
	const pathWithoutQuery = path.split(/[?#]/, 1)[0] ?? '';
	const hasParentSegment = pathWithoutQuery
		.split('/')
		.some((segment) =>
			decodeSegment(segment).split(PATH_SEPARATORS).includes(PARENT_SEGMENT),
		);
	if (hasParentSegment) {
		throw new RangeError(`Unsafe API path: ${path}`);
	}
}

function decodeSegment(segment: string): string {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}
