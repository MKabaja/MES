import type { UiLanguage } from '@/shared/config/app.config';
import { common as enCommon } from './locales/en/common';
import { errors as enErrors } from './locales/en/errors';
import { common as plCommon } from './locales/pl/common';
import { errors as plErrors } from './locales/pl/errors';

export const DEFAULT_LANGUAGE: UiLanguage = 'pl';

type ResourcesByLanguage = Record<
	UiLanguage,
	{ common: typeof plCommon; errors: typeof plErrors }
>;

export const resourcesByLanguage: ResourcesByLanguage = {
	pl: { common: plCommon, errors: plErrors },
	en: { common: enCommon, errors: enErrors },
};
