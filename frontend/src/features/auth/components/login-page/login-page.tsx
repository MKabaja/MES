import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components/logo/logo';
import { LoginForm } from '../login-form/login-form';
import { loginPageStyles } from './login-page.styles';

export type LoginPageProps = { redirect?: string | undefined };

/**
 * Renders the centered login card with the brand, the form and the support hint below it.
 */
export function LoginPage({ redirect }: LoginPageProps) {
	const { t } = useTranslation();

	return (
		<main className={loginPageStyles.root}>
			<section className={loginPageStyles.card}>
				<div className={loginPageStyles.brand}>
					<Logo />
					<span className={loginPageStyles.brandName}>{t('brand.name')}</span>
				</div>
				<div className={loginPageStyles.heading}>
					<h1 className={loginPageStyles.title}>{t('auth.login.title')}</h1>
					<p className={loginPageStyles.subtitle}>{t('auth.login.subtitle')}</p>
				</div>
				<LoginForm redirect={redirect} />
			</section>
			<p className={loginPageStyles.support}>{t('auth.login.support')}</p>
		</main>
	);
}
