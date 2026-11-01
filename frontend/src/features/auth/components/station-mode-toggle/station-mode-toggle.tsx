import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/shared/components/checkbox/checkbox';
import { Field } from '@/shared/components/field/field';
import { useStationMode } from './use-station-mode';

/**
 * Renders the checkbox that marks this device as a shared hall station (remembered across visits).
 */
export function StationModeToggle() {
	const { t } = useTranslation();
	const { isStationMode, changeStationMode } = useStationMode();

	return (
		<Field label={t('auth.stationMode.label')} orientation="horizontal">
			<Checkbox checked={isStationMode} onCheckedChange={changeStationMode} />
		</Field>
	);
}
