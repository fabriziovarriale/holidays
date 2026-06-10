<?php

use App\Http\Controllers\Api\LeavesController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::get('/leaves/approved', [LeavesController::class, 'approved'])
        ->name('api.v1.leaves.approved');
});
