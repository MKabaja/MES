import { z } from 'zod';

type StorageValues = {
	'mes.stationMode': boolean;
	'mes.sidebarCollapsed': boolean;
};

export type StorageKey = keyof StorageValues;

type StorageEntry<Value> = {
	schema: z.ZodType<Value>;
	fallback: Value;
};

type StorageEntryByKey = {
	[Key in StorageKey]: StorageEntry<StorageValues[Key]>;
};

const storageEntryByKey: StorageEntryByKey = {
	'mes.stationMode': { schema: z.boolean(), fallback: false },
	'mes.sidebarCollapsed': { schema: z.boolean(), fallback: false },
};

/**
 * Reads and validates a stored value, returning the key's default when it is missing, malformed or storage is unavailable.
 */
export function readStorage<Key extends StorageKey>(
	key: Key,
): StorageValues[Key] {
	const { schema, fallback } = storageEntryByKey[key];

	try {
		const raw = window.localStorage.getItem(key);
		if (raw === null) {
			return fallback;
		}
		const parsed = schema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : fallback;
	} catch {
		return fallback;
	}
}

/**
 * Stores a value as JSON; silently does nothing when storage is unavailable or full.
 */
export function writeStorage<Key extends StorageKey>(
	key: Key,
	value: StorageValues[Key],
): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
}
