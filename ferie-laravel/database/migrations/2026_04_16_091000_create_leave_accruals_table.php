<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_accruals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('year');

            $table->unsignedSmallInteger('total_days')->default(0);
            $table->unsignedSmallInteger('must_use_within_year_days')->default(0);
            $table->unsignedSmallInteger('used_days_at_rollover')->default(0);

            $table->unsignedSmallInteger('carryover_days')->default(0);
            $table->date('carryover_expires_at')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_accruals');
    }
};

