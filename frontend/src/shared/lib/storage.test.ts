import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readStorage, writeStorage } from './storage';

type FakeStorage = Pick<Storage, 'getItem' | 'setItem'>;

function stubStorage(
	initial: Record<string, string> = {},
): Map<string, string> {
	const items = new Map(Object.entries(initial));
	const fake: FakeStorage = {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => {
			items.set(key, value);
		},
	};
	vi.stubGlobal('localStorage', fake);
	return items;
}

function stubThrowingStorage(): void {
	const fail = () => {
		throw new DOMException('denied', 'SecurityError');
	};
	vi.stubGlobal('localStorage', { getItem: fail, setItem: fail });
}

beforeEach(() => {
	vi.unstubAllGlobals();
});

describe('readStorage', () => {
	it('returns the default when nothing is stored', () => {
		stubStorage();

		expect(readStorage('mes.stationMode')).toBe(false);
	});

	it('returns a stored valid value', () => {
		stubStorage({ 'mes.stationMode': 'true' });

		expect(readStorage('mes.stationMode')).toBe(true);
	});

	it('returns the default for corrupted JSON', () => {
		stubStorage({ 'mes.sidebarCollapsed': '{not json' });

		expect(readStorage('mes.sidebarCollapsed')).toBe(false);
	});

	it.each(['"true"', '1', 'null', '{"a":1}', '[]'])(
		'returns the default for %s that fails the schema',
		(raw) => {
			stubStorage({ 'mes.stationMode': raw });

			expect(readStorage('mes.stationMode')).toBe(false);
		},
	);

	it('returns the default when reading throws', () => {
		stubThrowingStorage();

		expect(readStorage('mes.stationMode')).toBe(false);
	});

	it('returns the default when storage itself is inaccessible', () => {
		vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
			throw new DOMException('denied', 'SecurityError');
		});

		expect(readStorage('mes.sidebarCollapsed')).toBe(false);
	});
});

describe('readStorage for mes.uiLanguage', () => {
	it('returns a stored supported language', () => {
		stubStorage({ 'mes.uiLanguage': '"en"' });

		expect(readStorage('mes.uiLanguage')).toBe('en');
	});

	it.each(['"de"', '"EN"', '{not json'])('returns Polish for %s', (raw) => {
		stubStorage({ 'mes.uiLanguage': raw });

		expect(readStorage('mes.uiLanguage')).toBe('pl');
	});

	it('returns Polish when nothing is stored', () => {
		stubStorage();

		expect(readStorage('mes.uiLanguage')).toBe('pl');
	});
});

describe('writeStorage', () => {
	it('persists a value that readStorage returns', () => {
		const items = stubStorage();

		writeStorage('mes.sidebarCollapsed', true);

		expect(items.get('mes.sidebarCollapsed')).toBe('true');
		expect(readStorage('mes.sidebarCollapsed')).toBe(true);
	});

	it('does not throw when writing fails', () => {
		stubThrowingStorage();

		expect(() => writeStorage('mes.stationMode', true)).not.toThrow();
	});
});
