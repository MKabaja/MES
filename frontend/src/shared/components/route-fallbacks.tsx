import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { routeFallbackStyles } from './route-fallbacks.styles';

/**
 * Default `pendingComponent` shown while a route is loading.
 */
export function RoutePending() {
	const { t } = useTranslation();

	return (
		<div role="status" className={routeFallbackStyles.container}>
			<p className={routeFallbackStyles.description}>
				{t('routeFallbacks.loading')}
			</p>
		</div>
	);
}

/**
 * Default `notFoundComponent` for unknown paths.
 */
export function RouteNotFound() {
	const { t } = useTranslation();

	return (
		<div className={routeFallbackStyles.container}>
			<h1 className={routeFallbackStyles.title}>
				{t('routeFallbacks.notFoundTitle')}
			</h1>
			<Link to="/" className={routeFallbackStyles.action}>
				{t('routeFallbacks.backToStart')}
			</Link>
		</div>
	);
}

type RouteErrorProps = { reset: () => void };

/**
 * Default `errorComponent` with a retry action.
 */
export function RouteError({ reset }: RouteErrorProps) {
	const { t } = useTranslation();

	return (
		<div role="alert" className={routeFallbackStyles.container}>
			<h1 className={routeFallbackStyles.title}>
				{t('routeFallbacks.errorTitle')}
			</h1>
			<button
				type="button"
				onClick={reset}
				className={routeFallbackStyles.action}
			>
				{t('routeFallbacks.retry')}
			</button>
		</div>
	);
}
