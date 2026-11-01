import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components/page-header/page-header';

export const Route = createFileRoute('/_auth/_admin/panel')({
	component: PanelPage,
});

function PanelPage() {
	const { t } = useTranslation();

	return <PageHeader title={t('nav.panel')} />;
}
