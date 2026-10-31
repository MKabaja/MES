import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { queryClient } from './query-client';
import { router } from './router';
import { i18n } from './shared/i18n/i18n';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<I18nextProvider i18n={i18n}>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</I18nextProvider>
	</StrictMode>,
);
