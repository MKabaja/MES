/**
 * Returns the uppercase initials of the first and last word of a full name, or an empty string for a blank name.
 */
export function getInitials(fullName: string): string {
	const words = fullName.trim().split(/\s+/).filter(Boolean);
	const firstWord = words.at(0);
	const lastWord = words.length > 1 ? words.at(-1) : undefined;

	return [firstWord, lastWord]
		.map((word) => word?.charAt(0) ?? '')
		.join('')
		.toUpperCase();
}
