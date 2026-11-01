import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { type BaseSyntheticEvent, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLogin } from '../../api/use-login';
import { loginFormSchema } from '../../model/auth.schemas';
import type { LoginFormValues } from '../../model/auth.types';
import { getLoginErrorMessage } from '../../utils/login-error-message';
import { getSafeRedirectPath } from '../../utils/safe-redirect';

export type LoginFormState = {
	form: UseFormReturn<LoginFormValues>;
	submit: (event?: BaseSyntheticEvent) => Promise<void>;
	isPending: boolean;
	serverErrorMessage: string | undefined;
	isPasswordVisible: boolean;
	togglePasswordVisibility: () => void;
};

/**
 * Drives the login form: local validation, the sign-in request and the redirect after success.
 * A successful sign-in drops the router cache and all toasts left from the previous session.
 * A submit while the previous one is still validating or signing in is ignored.
 *
 * `redirect` is followed only when it is a same-origin relative path, otherwise the user lands on `/`.
 */
export function useLoginForm(
	redirect: string | undefined,
	onSubmitAttempt?: () => void,
): LoginFormState {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const router = useRouter();
	const login = useLogin();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: { login: '', password: '' },
	});

	const submitValidated = form.handleSubmit((values) => {
		login.mutate(values, {
			onSuccess: () => {
				router.clearCache();
				toast.dismiss();
				return navigate({ href: getSafeRedirectPath(redirect), replace: true });
			},
		});
	});

	async function submit(event?: BaseSyntheticEvent): Promise<void> {
		if (form.formState.isSubmitting || login.isPending) {
			event?.preventDefault();
			return;
		}
		login.reset();
		onSubmitAttempt?.();
		await submitValidated(event);
	}

	function togglePasswordVisibility(): void {
		setIsPasswordVisible((isVisible) => !isVisible);
	}

	return {
		form,
		submit,
		isPending: login.isPending,
		serverErrorMessage: login.error
			? getLoginErrorMessage(login.error, t)
			: undefined,
		isPasswordVisible,
		togglePasswordVisibility,
	};
}
