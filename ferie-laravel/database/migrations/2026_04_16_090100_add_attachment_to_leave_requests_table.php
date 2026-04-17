<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('approved_days');
            $table->string('attachment_original_name')->nullable()->after('attachment_path');
            $table->string('attachment_mime', 100)->nullable()->after('attachment_original_name');
            $table->unsignedInteger('attachment_size')->nullable()->after('attachment_mime');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn([
                'attachment_path',
                'attachment_original_name',
                'attachment_mime',
                'attachment_size',
            ]);
        });
    }
};

