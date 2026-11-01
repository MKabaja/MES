import { z } from 'zod';
import { type UiLanguage, uiLanguageSchema } from '@/shared/config/app.config';

type StorageValues = {
	'mes.stationMode': boolean;
	'mes.sidebarCollapsed': boolean;
	'mes.uiLanguage': UiLanguage;
};

export type StorageKey = keyof StorageValues;

type SessionStorageValues = {
	'mes.pendingLogout': boolean;
};

export type SessionStorageKey = keyof SessionStorageValues;

type StorageEntry<Value> = {
	schema: z.ZodType<Value>;
	fallback: Value;
};

type StorageEntryByKey = {
	[Key in StorageKey]: StorageEntry<StorageValues[Key]>;
};

type SessionStorageEntryByKey = {
	[Key in SessionStorageKey]: StorageEntry<SessionStorageValues[Key]>;
};

const storageEntryByKey: StorageEntryByKey = {
	'mes.stationMode': { schema: z.boolean(), fallback: false },
	'mes.sidebarCollapsed': { schema: z.boolean(), fallback: false },
	'mes.uiLanguage': { schema: uiLanguageSchema, fallback: 'pl' },
};

const sessionStorageEntryByKey: SessionStorageEntryByKey = {
	'mes.pendingLogout': { schema: z.boolean(), fallback: false },
};

/**
 * Reads and validates a stored value, returning the key's default when it is missing, malformed or storage is unavailable.
 */
export function readStorage<Key extends StorageKey>(
	key: Key,
): StorageValues[Key] {
	return readEntry(getLocalStorage, key, storageEntryByKey[key]);
}

/**
 * Stores a value as JSON; silently does nothing when storage is unavailable or full.
 */
export function writeStorage<Key extends StorageKey>(
	key: Key,
	value: StorageValues[Key],
): void {
	writeEntry(getLocalStorage, key, value);
}

/**
 * Reads and validates a value kept for this tab only, returning the key's default when it is missing, malformed or storage is unavailable.
 */
export function readSessionStorage<Key extends SessionStorageKey>(
	key: Key,
): SessionStorageValues[Key] {
	return readEntry(getSessionStorage, key, sessionStorageEntryByKey[key]);
}

/**
 * Stores a value as JSON for this tab only (it survives a reload); silently does nothing when storage is unavailable or full.
 */
export function writeSessionStorage<Key extends SessionStorageKey>(
	key: Key,
	value: SessionStorageValues[Key],
): void {
	writeEntry(getSessionStorage, key, value);
}

/**
 * Removes a value kept for this tab; silently does nothing when storage is unavailable.
 */
export function removeSessionStorage(key: SessionStorageKey): void {
	try {
		getSessionStorage().removeItem(key);
	} catch {
		return;
	}
}

function readEntry<Value>(
	getStorage: () => Storage,
	key: string,
	{ schema, fallback }: StorageEntry<Value>,
): Value {
	try {
		const raw = getStorage().getItem(key);
		if (raw === null) {
			return fallback;
		}
		const parsed = schema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : fallback;
	} catch {
		return fallback;
	}
}

function writeEntry(
	getStorage: () => Storage,
	key: string,
	value: unknown,
): void {
	try {
		getStorage().setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
}

function getLocalStorage(): Storage {
	return window.localStorage;
}

function getSessionStorage(): Storage {
	return window.sessionStorage;
}
