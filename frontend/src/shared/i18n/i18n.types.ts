import type { common } from './locales/pl/common';
import type { errors } from './locales/pl/errors';

export type I18nResources = {
	common: typeof common;
	errors: typeof errors;
};

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'common';
		resources: I18nResources;
	}
}
