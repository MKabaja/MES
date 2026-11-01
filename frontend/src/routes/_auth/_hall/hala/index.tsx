import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components/page-header/page-header';

export const Route = createFileRoute('/_auth/_hall/hala/')({
	component: HallPage,
});

function HallPage() {
	const { t } = useTranslation();

	return <PageHeader title={t('nav.hall')} />;
}
