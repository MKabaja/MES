import { useState } from 'react';
import { readStorage, writeStorage } from '@/shared/lib/storage';

export type SidebarCollapsedState = {
	isCollapsed: boolean;
	toggle: () => void;
};

/**
 * Tracks whether the sidebar is collapsed and persists the choice across visits.
 */
export function useSidebarCollapsed(): SidebarCollapsedState {
	const [isCollapsed, setIsCollapsed] = useState(() =>
		readStorage('mes.sidebarCollapsed'),
	);

	function toggle() {
		const nextIsCollapsed = !isCollapsed;
		setIsCollapsed(nextIsCollapsed);
		writeStorage('mes.sidebarCollapsed', nextIsCollapsed);
	}

	return { isCollapsed, toggle };
}
