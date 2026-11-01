import { describe, expect, it } from 'vitest';
import { getInitials } from './get-initials';

describe('getInitials', () => {
	it('uses the first and last word of the name', () => {
		expect(getInitials('Jan Maria Kowalski')).toBe('JK');
	});

	it('handles a single word, lowercase input and a blank name', () => {
		expect(getInitials('anna')).toBe('A');
		expect(getInitials('   ')).toBe('');
	});
});
