import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/shared/components/alert/alert';
import { AlertDescription } from '@/shared/components/alert/alert.description';
import { Logo } from '@/shared/components/logo/logo';
import { LoginForm } from '../login-form/login-form';
import { loginPageStyles } from './login-page.styles';

export type LoginPageProps = { redirect?: string | undefined };

/**
 * Renders the centered login card with the brand, the form and the support hint below it.
 * Shows the server message passed in history state when the session was ended by the server.
 */
export function LoginPage({ redirect }: LoginPageProps) {
	const { t } = useTranslation();
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const sessionEndedMessage = useLocation({
		select: (location) => location.state.sessionEndedMessage,
	});

	function handleSubmitAttempt() {
		setHasSubmitted(true);
	}

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
				{sessionEndedMessage && !hasSubmitted ? (
					<Alert variant="danger">
						<AlertDescription>{sessionEndedMessage}</AlertDescription>
					</Alert>
				) : null}
				<LoginForm redirect={redirect} onSubmitAttempt={handleSubmitAttempt} />
			</section>
			<p className={loginPageStyles.support}>{t('auth.login.support')}</p>
		</main>
	);
}
