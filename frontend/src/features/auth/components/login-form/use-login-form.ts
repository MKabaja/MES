import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { type BaseSyntheticEvent, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
 *
 * `redirect` is followed only when it is a same-origin relative path, otherwise the user lands on `/`.
 */
export function useLoginForm(
	redirect: string | undefined,
	onSubmitAttempt?: () => void,
): LoginFormState {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const login = useLogin();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: { login: '', password: '' },
	});

	const submitValidated = form.handleSubmit((values) => {
		login.mutate(values, {
			onSuccess: () =>
				navigate({ href: getSafeRedirectPath(redirect), replace: true }),
		});
	});

	function submit(event?: BaseSyntheticEvent): Promise<void> {
		login.reset();
		onSubmitAttempt?.();
		return submitValidated(event);
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
