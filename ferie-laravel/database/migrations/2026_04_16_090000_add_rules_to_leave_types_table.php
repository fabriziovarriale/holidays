<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->boolean('requires_attachment')->default(false)->after('active');
            $table->unsignedSmallInteger('max_consecutive_days')->nullable()->after('requires_attachment');
            $table->unsignedSmallInteger('notice_days_required')->default(0)->after('max_consecutive_days');
            $table->string('accrual_rule', 50)->nullable()->after('notice_days_required');
        });
    }

    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn([
                'requires_attachment',
                'max_consecutive_days',
                'notice_days_required',
                'accrual_rule',
            ]);
        });
    }
};

