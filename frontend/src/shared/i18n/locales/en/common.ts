import type { common as polishCommon } from '../pl/common';

export const common: typeof polishCommon = {
	routeFallbacks: {
		loading: 'Loading…',
		notFoundTitle: 'Page not found',
		backToStart: 'Back to start',
		errorTitle: 'Something went wrong',
		retry: 'Try again',
	},
	numberStepper: {
		decrease: 'Decrease',
		increase: 'Increase',
	},
	pagination: {
		label: 'Pagination',
		previous: 'Previous page',
		next: 'Next page',
		page: 'Page {{page}}',
	},
	dialog: {
		close: 'Close',
		cancel: 'Cancel',
	},
	toaster: {
		label: 'Notifications',
	},
	table: {
		loading: 'Loading data…',
	},
	operationStatus: {
		pending: 'Planned',
		in_progress: 'In progress',
		paused: 'Paused',
		completed: 'Completed',
	},
	brand: {
		name: 'MES',
		tagline: 'Welding shop',
	},
	session: {
		logout: 'Log out',
	},
	appShell: {
		mainMenu: 'Main menu',
		collapseMenu: 'Collapse menu',
		expandMenu: 'Expand menu',
		openMenu: 'Open menu',
	},
	home: {
		title: 'OK',
	},
};
