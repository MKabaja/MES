import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/shared/components/alert/alert';
import { AlertDescription } from '@/shared/components/alert/alert.description';
import { Button } from '@/shared/components/button/button';
import { Field } from '@/shared/components/field/field';
import { Input } from '@/shared/components/input/input';
import { Spinner } from '@/shared/components/spinner/spinner';
import { StationModeToggle } from '../station-mode-toggle/station-mode-toggle';
import { loginFormStyles } from './login-form.styles';
import { useLoginForm } from './use-login-form';

export type LoginFormProps = { redirect?: string | undefined };

/**
 * Renders the sign-in form; a failed attempt shows one message under the button and marks both fields invalid.
 */
export function LoginForm({ redirect }: LoginFormProps) {
	const { t } = useTranslation();
	const {
		form,
		submit,
		isPending,
		serverErrorMessage,
		isPasswordVisible,
		togglePasswordVisibility,
	} = useLoginForm(redirect);
	const { register, formState } = form;
	const hasServerError = serverErrorMessage !== undefined;

	return (
		<form noValidate onSubmit={submit} className={loginFormStyles.root}>
			<Field
				label={t('auth.login.loginLabel')}
				error={
					formState.errors.login ? t('auth.login.loginRequired') : undefined
				}
			>
				<Input
					type="text"
					autoComplete="username"
					autoCapitalize="none"
					spellCheck={false}
					required
					aria-invalid={hasServerError || undefined}
					{...register('login')}
				/>
			</Field>
			<Field
				label={t('auth.login.passwordLabel')}
				error={
					formState.errors.password
						? t('auth.login.passwordRequired')
						: undefined
				}
			>
				<Input
					type={isPasswordVisible ? 'text' : 'password'}
					autoComplete="current-password"
					required
					aria-invalid={hasServerError || undefined}
					endAction={
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className={loginFormStyles.togglePasswordButton}
							aria-label={t('auth.login.showPassword')}
							aria-pressed={isPasswordVisible}
							onClick={togglePasswordVisibility}
						>
							{isPasswordVisible ? (
								<EyeOff aria-hidden="true" />
							) : (
								<Eye aria-hidden="true" />
							)}
						</Button>
					}
					{...register('password')}
				/>
			</Field>
			<StationModeToggle />
			<Button
				type="submit"
				className={loginFormStyles.submitButton}
				disabled={isPending}
				aria-busy={isPending}
			>
				{isPending ? <Spinner /> : null}
				{t('auth.login.submit')}
			</Button>
			{hasServerError ? (
				<Alert variant="danger">
					<AlertDescription>{serverErrorMessage}</AlertDescription>
				</Alert>
			) : null}
		</form>
	);
}
