<?php

use App\Http\Controllers\Admin\ReportsPageController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeaveRequestAttachmentController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RequestsController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/requests', [RequestsController::class, 'index'])->name('requests.index');

    Route::get('/dashboard/request', fn () => redirect()->route('dashboard'))
        ->name('leave-request.create');
    Route::post('/dashboard/request', [LeaveRequestController::class, 'store'])
        ->name('leave-request.store');
    Route::patch('/dashboard/request/{leaveRequest}/cancel', [LeaveRequestController::class, 'cancel'])
        ->name('leave-request.cancel');
    Route::get('/dashboard/request/{leaveRequest}/attachment', [LeaveRequestAttachmentController::class, 'download'])
        ->name('leave-request.attachment');

    Route::get('/notifications', [NotificationsController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationsController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationsController::class, 'markAllAsRead'])->name('notifications.read-all');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/team', [TeamController::class, 'index'])->name('team.index');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [UsersController::class, 'index'])->name('users.index');
    Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}/balance', [UsersController::class, 'updateBalance'])->name('users.balance');
    Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
    Route::get('/reports', [ReportsPageController::class, 'index'])->name('reports.index');
    Route::get('/reports/export-leaves', [App\Http\Controllers\Admin\ReportController::class, 'exportLeaves'])->name('reports.export-leaves');
    Route::patch('/requests/{leaveRequest}/approve', [App\Http\Controllers\Admin\LeaveRequestController::class, 'approve'])->name('requests.approve');
    Route::patch('/requests/{leaveRequest}/reject', [App\Http\Controllers\Admin\LeaveRequestController::class, 'reject'])->name('requests.reject');
    Route::patch('/requests/{leaveRequest}/revoke', [App\Http\Controllers\Admin\LeaveRequestController::class, 'revoke'])->name('requests.revoke');
    Route::delete('/requests/{leaveRequest}', [App\Http\Controllers\Admin\LeaveRequestController::class, 'destroy'])->name('requests.destroy');
    Route::post('/users/{user}/impersonate', [UsersController::class, 'impersonate'])->name('users.impersonate');

});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/impersonation/stop', [App\Http\Controllers\Admin\UsersController::class, 'stopImpersonation'])->name('impersonation.stop');
});

require __DIR__.'/auth.php';
