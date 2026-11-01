import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { csrfHandlers } from './handlers/csrf';

export const handlers = [...csrfHandlers, ...authHandlers];

export const server = setupServer(...handlers);
