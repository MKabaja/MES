import { useState } from 'react';
import { readStorage, writeStorage } from '@/shared/lib/storage';

export type StationModeState = {
	isStationMode: boolean;
	changeStationMode: (isEnabled: boolean) => void;
};

/**
 * Tracks whether this device is a shared hall station and persists the choice in browser storage.
 */
export function useStationMode(): StationModeState {
	const [isStationMode, setIsStationMode] = useState(() =>
		readStorage('mes.stationMode'),
	);

	function changeStationMode(isEnabled: boolean): void {
		setIsStationMode(isEnabled);
		writeStorage('mes.stationMode', isEnabled);
	}

	return { isStationMode, changeStationMode };
}
