import { useEffect } from 'react';
import { config } from '@/shared/config/app.config';

/**
 * Calls `onClose` whenever the viewport becomes desktop-wide, so a mobile-only overlay never outlives its breakpoint.
 */
export function useCloseOnDesktop(onClose: () => void): void {
	useEffect(() => {
		const mediaQuery = window.matchMedia(config.layout.desktopMediaQuery);

		function handleChange(event: MediaQueryListEvent) {
			if (event.matches) {
				onClose();
			}
		}

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [onClose]);
}
