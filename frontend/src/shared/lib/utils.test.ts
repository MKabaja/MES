import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('joins class names and skips falsy conditions', () => {
		const isActive = false;

		expect(cn('px-2', isActive && 'font-bold', undefined, 'text-sm')).toBe(
			'px-2 text-sm',
		);
	});

	it('keeps the last of conflicting Tailwind utilities', () => {
		expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4');
	});

	it('accepts object and array class values', () => {
		expect(cn(['flex', { 'items-center': true, 'justify-end': false }])).toBe(
			'flex items-center',
		);
	});
});
