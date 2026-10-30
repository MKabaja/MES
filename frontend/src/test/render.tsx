import { type RenderResult, render } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';

export type RenderWithProvidersResult = RenderResult & { user: UserEvent };

/**
 * Renders a component and returns a ready `userEvent` instance next to the Testing Library result.
 */
export function renderWithProviders(
	ui: ReactElement,
): RenderWithProvidersResult {
	const user = userEvent.setup();
	return { user, ...render(ui) };
}
