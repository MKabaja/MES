import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { csrfHandlers } from './handlers/csrf';
import { settingsHandlers } from './handlers/settings';

export const handlers = [...csrfHandlers, ...authHandlers, ...settingsHandlers];

export const server = setupServer(...handlers);
