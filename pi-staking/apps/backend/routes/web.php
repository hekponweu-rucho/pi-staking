<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MailtrapTestController;

Route::get('/', function () {
    return view('welcome');
});

// Routes de test Mailtrap (à supprimer en production)
Route::prefix('test-mailtrap')->group(function () {
    Route::get('/', [MailtrapTestController::class, 'index']);
    Route::post('/simple', [MailtrapTestController::class, 'testSimple']);
    Route::post('/security', [MailtrapTestController::class, 'testSecurity']);
    Route::post('/withdrawal', [MailtrapTestController::class, 'testWithdrawal']);
    Route::post('/suspicious', [MailtrapTestController::class, 'testSuspicious']);
    Route::post('/all', [MailtrapTestController::class, 'testAll']);
});
