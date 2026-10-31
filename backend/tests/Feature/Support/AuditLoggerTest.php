<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\User;
use App\Support\Audit\AuditLogger;

it('stores actor, action, subject, values and ip', function (): void {
    $actor = User::factory()->admin()->create();
    $subject = User::factory()->create();

    $entry = app(AuditLogger::class)->log(
        $actor,
        AuditLogger::USER_DEACTIVATED,
        $subject,
        ['is_active' => true],
        ['is_active' => false],
        '203.0.113.7',
    );

    $this->assertDatabaseHas('audit_logs', [
        'id' => $entry->id,
        'user_id' => $actor->id,
        'action' => 'user.deactivated',
        'subject_type' => 'user',
        'subject_id' => $subject->id,
        'ip' => '203.0.113.7',
    ]);
    expect($entry->fresh()->before)->toBe(['is_active' => true])
        ->and($entry->fresh()->after)->toBe(['is_active' => false])
        ->and($entry->fresh()->created_at)->not->toBeNull()
        ->and($entry->subject->is($subject))->toBeTrue()
        ->and($entry->user->is($actor))->toBeTrue();
});

it('never stores passwords or tokens, also when nested', function (): void {
    $subject = User::factory()->create();

    $entry = app(AuditLogger::class)->log(
        null,
        AuditLogger::USER_PASSWORD_RESET,
        $subject,
        ['login' => 'jkowal', 'password' => 'old-hash', 'meta' => ['remember_token' => 'abc', 'kept' => 1]],
        ['Password' => 'new-secret', 'password_confirmation' => 'new-secret', 'login' => 'jkowal'],
    );

    $raw = (string) AuditLog::query()->toBase()->where('id', $entry->id)->value('before').
        (string) AuditLog::query()->toBase()->where('id', $entry->id)->value('after');
    expect($entry->fresh()->before)->toEqual(['login' => 'jkowal', 'meta' => ['kept' => 1]])
        ->and($entry->fresh()->after)->toBe(['login' => 'jkowal'])
        ->and($raw)->not->toContain('old-hash')->not->toContain('new-secret')->not->toContain('abc');
});

it('drops any key containing password, token or secret and keeps ordinary fields', function (): void {
    $subject = User::factory()->create();

    $entry = app(AuditLogger::class)->log(
        null,
        AuditLogger::USER_PASSWORD_RESET,
        $subject,
        ['new_password' => 'a', 'api_token' => 'b', 'Client_Secret' => 'c', 'first_name' => 'Jan'],
        ['users' => [['password' => 'x', 'first_name' => 'Anna']]],
    );

    expect($entry->fresh()->before)->toBe(['first_name' => 'Jan'])
        ->and($entry->fresh()->after)->toBe(['users' => [['first_name' => 'Anna']]]);
});
