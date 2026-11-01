import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components/logo/logo';
import { appShellStyles } from './app-shell.styles';

export type BrandProps = { isCollapsed?: boolean };

export function Brand({ isCollapsed = false }: BrandProps) {
	const { t } = useTranslation();

	return (
		<>
			<Logo title={isCollapsed ? t('brand.name') : undefined} />
			{isCollapsed ? null : (
				<div className={appShellStyles.brandText}>
					<span className={appShellStyles.brandName}>{t('brand.name')}</span>
					<span className={appShellStyles.brandTagline}>
						{t('brand.tagline')}
					</span>
				</div>
			)}
		</>
	);
}
