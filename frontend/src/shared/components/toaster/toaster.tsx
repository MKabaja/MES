import { useTranslation } from 'react-i18next';
import { Toaster as SonnerToaster } from 'sonner';
import { iconByAlertVariant } from '@/shared/components/alert/alert.constants';
import { toasterStyles } from './toaster.styles';

const InfoIcon = iconByAlertVariant.info;
const SuccessIcon = iconByAlertVariant.success;
const WarningIcon = iconByAlertVariant.warning;
const ErrorIcon = iconByAlertVariant.danger;

const toastIcons = {
	info: <InfoIcon aria-hidden="true" />,
	success: <SuccessIcon aria-hidden="true" />,
	warning: <WarningIcon aria-hidden="true" />,
	error: <ErrorIcon aria-hidden="true" />,
};

const toastOptions = {
	unstyled: true,
	classNames: toasterStyles,
};

/**
 * Mounts the toast region once for the whole app; show toasts with `toast.success`, `toast.error`, `toast.warning` or `toast.info` from `sonner`.
 * Toasts appear bottom right, close after 5 seconds and pause while hovered.
 */
export function Toaster() {
	const { t } = useTranslation();

	return (
		<SonnerToaster
			theme="dark"
			position="bottom-right"
			duration={4000}
			containerAriaLabel={t('toaster.label')}
			icons={toastIcons}
			toastOptions={toastOptions}
		/>
	);
}
