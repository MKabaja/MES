import { Link } from '@tanstack/react-router';
import { routeFallbackStyles } from './route-fallbacks.styles';

/**
 * Default `pendingComponent` shown while a route is loading.
 */
export function RoutePending() {
	return (
		<div role="status" className={routeFallbackStyles.container}>
			<p className={routeFallbackStyles.description}>Ładowanie…</p>
		</div>
	);
}

/**
 * Default `notFoundComponent` for unknown paths.
 */
export function RouteNotFound() {
	return (
		<div className={routeFallbackStyles.container}>
			<h1 className={routeFallbackStyles.title}>Nie znaleziono strony</h1>
			<Link to="/" className={routeFallbackStyles.action}>
				Wróć do początku
			</Link>
		</div>
	);
}

type RouteErrorProps = { reset: () => void };

/**
 * Default `errorComponent` with a retry action.
 */
export function RouteError({ reset }: RouteErrorProps) {
	return (
		<div role="alert" className={routeFallbackStyles.container}>
			<h1 className={routeFallbackStyles.title}>Coś poszło nie tak</h1>
			<button
				type="button"
				onClick={reset}
				className={routeFallbackStyles.action}
			>
				Spróbuj ponownie
			</button>
		</div>
	);
}
