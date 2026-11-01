import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/button/button';

/**
 * Renders the secondary "Anuluj" button that closes the surrounding {@link Dialog}.
 */
export function DialogCancel() {
	const { t } = useTranslation();

	return (
		<DialogPrimitive.Close render={<Button variant="secondary" />}>
			{t('dialog.cancel')}
		</DialogPrimitive.Close>
	);
}
