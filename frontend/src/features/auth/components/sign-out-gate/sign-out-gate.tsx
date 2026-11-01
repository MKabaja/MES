import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/shared/components/spinner/spinner';
import { useSessionEndingState } from '../use-session-ending-state';
import { signOutGateStyles } from './sign-out-gate.styles';

export type SignOutGateProps = { children: ReactNode };

/**
 * Renders `children` unless a sign-out waits for the server; then covers the whole app with a "Wylogowywanie…" status instead.
 */
export function SignOutGate({ children }: SignOutGateProps) {
	const sessionEndingState = useSessionEndingState();

	if (sessionEndingState.status !== 'awaitingServerLogout') {
		return children;
	}
	return <SigningOutScreen isOffline={sessionEndingState.isOffline} />;
}

type SigningOutScreenProps = { isOffline: boolean };

function SigningOutScreen({ isOffline }: SigningOutScreenProps) {
	const { t } = useTranslation();

	return (
		<div role="status" className={signOutGateStyles.root}>
			<Spinner className={signOutGateStyles.spinner} />
			<p className={signOutGateStyles.title}>{t('auth.signingOut.title')}</p>
			{isOffline ? (
				<p className={signOutGateStyles.description}>
					{t('auth.signingOut.offline')}
				</p>
			) : null}
		</div>
	);
}
