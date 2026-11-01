import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@/features/auth/components/login-page/login-page';
import { loginSearchSchema } from '@/features/auth/model/auth.schemas';

export const Route = createFileRoute('/login')({
	validateSearch: loginSearchSchema,
	component: LoginRoute,
});

function LoginRoute() {
	const { redirect } = Route.useSearch();

	return <LoginPage redirect={redirect} />;
}
