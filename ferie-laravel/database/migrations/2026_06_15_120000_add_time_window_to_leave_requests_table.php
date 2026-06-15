<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Aggiunge `start_time` / `end_time` (HH:MM, formato TIME) per
     * caratterizzare il blocco orario dei PERMESSO. Nullable: i record
     * preesistenti restano senza orario, le richieste future di tipo
     * PERMESSO devono averli (vincolo a livello form, non DB, per non
     * rompere lo storico).
     */
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->time('start_time')->nullable()->after('end_date');
            $table->time('end_time')->nullable()->after('start_time');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time']);
        });
    }
};
