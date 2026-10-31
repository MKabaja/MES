<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table): void {
            $table->smallInteger('id')->primary();
            $table->time('shift_start');
            $table->time('shift_end');
            $table->jsonb('breaks');
            $table->boolean('deduct_breaks');
            $table->boolean('auto_pause_enabled');
            $table->smallInteger('worker_backdate_days');
            $table->smallInteger('station_idle_logout_minutes');
            $table->boolean('worker_network_restriction_enabled');
            $table->jsonb('worker_allowed_networks');
            $table->timestamp('updated_at')->nullable();
        });

        DB::statement('ALTER TABLE settings ADD CONSTRAINT settings_single_row CHECK (id = 1)');

        DB::table('settings')->insert([
            'id' => 1,
            'shift_start' => '06:00',
            'shift_end' => '14:00',
            'breaks' => json_encode([['start' => '10:00', 'end' => '10:15']], JSON_THROW_ON_ERROR),
            'deduct_breaks' => true,
            'auto_pause_enabled' => true,
            'worker_backdate_days' => 2,
            'station_idle_logout_minutes' => 5,
            'worker_network_restriction_enabled' => false,
            'worker_allowed_networks' => json_encode([], JSON_THROW_ON_ERROR),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
