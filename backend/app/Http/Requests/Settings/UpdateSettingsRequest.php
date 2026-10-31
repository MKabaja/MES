<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use App\Data\SettingsData;
use App\Domain\ValueObjects\BreakWindow;
use App\Domain\ValueObjects\PlantSettings;
use App\Models\User;
use App\Rules\ValidNetwork;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $timeRules = ['required', 'string', 'regex:'.BreakWindow::TIME_PATTERN, 'date_format:H:i'];

        return [
            'shift_start' => $timeRules,
            'shift_end' => [...$timeRules, 'after:shift_start'],
            'breaks' => ['present', 'array', 'list', 'max:'.PlantSettings::MAX_BREAKS],
            'breaks.*' => ['array'],
            'breaks.*.start' => [...$timeRules, 'after_or_equal:shift_start'],
            'breaks.*.end' => [...$timeRules, 'after:breaks.*.start', 'before_or_equal:shift_end'],
            'deduct_breaks' => ['required', 'boolean'],
            'auto_pause_enabled' => ['required', 'boolean'],
            'worker_backdate_days' => ['required', 'integer', 'between:0,'.PlantSettings::MAX_BACKDATE_DAYS],
            'station_idle_logout_minutes' => [
                'required',
                'integer',
                'between:'.PlantSettings::MIN_IDLE_LOGOUT_MINUTES.','.PlantSettings::MAX_IDLE_LOGOUT_MINUTES,
            ],
            'worker_network_restriction_enabled' => ['required', 'boolean'],
            'worker_allowed_networks' => [
                'present',
                'array',
                'list',
                'max:'.PlantSettings::MAX_ALLOWED_NETWORKS,
                'required_if_accepted:worker_network_restriction_enabled',
            ],
            'worker_allowed_networks.*' => ['required', 'string', 'distinct', new ValidNetwork],
        ];
    }

    /**
     * @return list<callable(ValidatorContract): void>
     */
    public function after(): array
    {
        return [function (ValidatorContract $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $this->rejectOverlappingBreaks($validator);
        }];
    }

    /**
     * Returns the signed-in user performing the update.
     *
     * @throws AuthenticationException
     */
    public function actor(): User
    {
        $user = $this->user();

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return $user;
    }

    /**
     * Builds the settings data from the validated input.
     */
    public function toData(): SettingsData
    {
        $breaks = [];
        foreach ($this->array('breaks') as $break) {
            if (is_array($break)) {
                $breaks[] = new BreakWindow((string) $break['start'], (string) $break['end']);
            }
        }

        return new SettingsData(
            shiftStart: $this->string('shift_start')->toString(),
            shiftEnd: $this->string('shift_end')->toString(),
            breaks: $breaks,
            deductBreaks: $this->boolean('deduct_breaks'),
            autoPauseEnabled: $this->boolean('auto_pause_enabled'),
            workerBackdateDays: $this->integer('worker_backdate_days'),
            stationIdleLogoutMinutes: $this->integer('station_idle_logout_minutes'),
            workerNetworkRestrictionEnabled: $this->boolean('worker_network_restriction_enabled'),
            workerAllowedNetworks: array_values(array_map(
                static fn (mixed $network): string => (string) $network,
                $this->array('worker_allowed_networks'),
            )),
        );
    }

    private function rejectOverlappingBreaks(ValidatorContract $validator): void
    {
        $startByIndex = [];
        $endByIndex = [];
        foreach ($this->array('breaks') as $index => $break) {
            if (is_array($break)) {
                $startByIndex[$index] = (string) $break['start'];
                $endByIndex[$index] = (string) $break['end'];
            }
        }

        asort($startByIndex);

        $previousEnd = $this->string('shift_start')->toString();
        foreach ($startByIndex as $index => $start) {
            if ($start < $previousEnd) {
                $validator->errors()->add("breaks.{$index}.start", __('validation.break_overlap'));
            }
            $previousEnd = $endByIndex[$index];
        }
    }
}
