import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
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
 * Default `errorComponent` whose retry action resets query errors and reloads the route.
 */
export function RouteError({ reset }: RouteErrorProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const queryErrorResetBoundary = useQueryErrorResetBoundary();

	function handleRetry() {
		queryErrorResetBoundary.reset();
		reset();
		void router.invalidate();
	}

	return (
		<div role="alert" className={routeFallbackStyles.container}>
			<h1 className={routeFallbackStyles.title}>
				{t('routeFallbacks.errorTitle')}
			</h1>
			<button
				type="button"
				onClick={handleRetry}
				className={routeFallbackStyles.action}
			>
				{t('routeFallbacks.retry')}
			</button>
		</div>
	);
}
