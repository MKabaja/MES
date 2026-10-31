<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Users\CreateAdminAction;
use App\Data\AdminData;
use App\Models\User;
use App\Rules\OfficeLogin;
use App\Rules\PersonName;
use App\Rules\WorkerPassword;
use App\Support\Console\StandardInput;
use Closure;
use Illuminate\Console\Command;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateAdminCommand extends Command
{
    private const int MIN_PASSWORD_LENGTH = 12;

    private const int MAX_PASSWORD_LENGTH = 64;

    protected $signature = 'mes:create-admin
        {--first-name= : First name}
        {--last-name= : Last name}
        {--login= : Login}
        {--password-stdin : Read the password from the first line of standard input}';

    protected $description = 'Create an office (admin) account';

    /**
     * Collects the account data, validates it and creates the office account.
     */
    public function handle(CreateAdminAction $createAdmin, StandardInput $standardInput): int
    {
        $input = $this->collectInput($standardInput);

        if ($input === null) {
            return self::FAILURE;
        }

        $validator = Validator::make($input, $this->rules());

        if ($validator->fails()) {
            $this->components->error('Nie utworzono konta:');
            foreach ($validator->errors()->all() as $message) {
                $this->line(' - '.$message);
            }

            return self::FAILURE;
        }

        try {
            $admin = $createAdmin->handle(new AdminData(
                firstName: $input['first_name'],
                lastName: $input['last_name'],
                login: $input['login'],
                password: $input['password'],
            ));
        } catch (UniqueConstraintViolationException) {
            $this->components->error('Nie utworzono konta: '.__('validation.unique', ['attribute' => __('validation.attributes.login')]));

            return self::FAILURE;
        }

        $this->components->info(sprintf('Utworzono konto biura z loginem %s.', $admin->login));

        return self::SUCCESS;
    }

    /**
     * @return array{first_name: string, last_name: string, login: string, password: string, password_confirmation: string}|null
     */
    private function collectInput(StandardInput $standardInput): ?array
    {
        $usesStdin = (bool) $this->option('password-stdin');

        if (! $usesStdin && ! $this->input->isInteractive()) {
            $this->components->error('Bez trybu interaktywnego hasło trzeba podać przez --password-stdin.');

            return null;
        }

        $firstName = $this->optionOrAsk('first-name', 'Imię');
        $lastName = $this->optionOrAsk('last-name', 'Nazwisko');
        $login = $this->optionOrAsk('login', 'Login');

        if ($firstName === null || $lastName === null || $login === null) {
            $this->components->error('Bez trybu interaktywnego podaj --first-name, --last-name i --login.');

            return null;
        }

        if ($usesStdin) {
            $password = $standardInput->readLine();

            if ($password === null) {
                $this->components->error('Nie odczytano hasła ze standardowego wejścia.');

                return null;
            }

            $passwordConfirmation = $password;
        } else {
            $password = (string) $this->secret('Hasło');
            $passwordConfirmation = (string) $this->secret('Powtórz hasło');
        }

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'login' => $login,
            'password' => $password,
            'password_confirmation' => $passwordConfirmation,
        ];
    }

    private function optionOrAsk(string $option, string $question): ?string
    {
        $value = $this->option($option);

        if (is_string($value)) {
            return trim($value);
        }

        if (! $this->input->isInteractive()) {
            return null;
        }

        return trim((string) $this->ask($question));
    }

    /**
     * @return array<string, list<mixed>>
     */
    private function rules(): array
    {
        $loginIsFree = function (string $attribute, mixed $value, Closure $fail): void {
            $isTaken = is_string($value)
                && User::query()->whereRaw('lower(login) = ?', [Str::lower($value)])->exists();

            if ($isTaken) {
                $fail('validation.unique')->translate();
            }
        };

        return [
            'first_name' => ['required', 'string', 'max:60', new PersonName],
            'last_name' => ['required', 'string', 'max:60', new PersonName],
            'login' => ['required', 'string', 'min:3', 'max:30', new OfficeLogin, $loginIsFree],
            'password' => ['required', 'string', 'min:'.self::MIN_PASSWORD_LENGTH, 'max:'.self::MAX_PASSWORD_LENGTH, new WorkerPassword],
            'password_confirmation' => ['same:password'],
        ];
    }
}
