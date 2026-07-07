<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * bbos è la fonte di verità degli utenti: `bbos_id` è l'id dell'utente su
 * bbos, valorizzato al primo login SSO (provisioning JIT). Nullable perché
 * gli account locali (admin/seed/creati a mano per test) non ne hanno uno
 * finché non fanno login via bbos con la stessa email (match by email →
 * backfill del bbos_id). Unique per garantire il match 1:1.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('bbos_id')->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['bbos_id']);
            $table->dropColumn('bbos_id');
        });
    }
};
