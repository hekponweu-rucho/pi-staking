<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Authorization\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Exception;
use Throwable;

class ApiExceptionHandler
{
    /**
     * Render une exception en réponse JSON pour l'API
     */
    public static function render(Request $request, Throwable $e): JsonResponse
    {
        // Validation errors
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR'
            ], 422);
        }

        // Authentication errors
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
                'error_code' => 'AUTHENTICATION_ERROR'
            ], 401);
        }

        // Authorization errors
        if ($e instanceof AuthorizationException) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé',
                'error_code' => 'AUTHORIZATION_ERROR'
            ], 403);
        }

        // Model not found errors
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return response()->json([
                'success' => false,
                'message' => "{$model} introuvable",
                'error_code' => 'MODEL_NOT_FOUND'
            ], 404);
        }

        // Route not found
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Endpoint non trouvé',
                'error_code' => 'ENDPOINT_NOT_FOUND'
            ], 404);
        }

        // Method not allowed
        if ($e instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Méthode HTTP non autorisée',
                'error_code' => 'METHOD_NOT_ALLOWED'
            ], 405);
        }

        // HTTP exceptions
        if ($e instanceof HttpException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Erreur HTTP',
                'error_code' => 'HTTP_ERROR'
            ], $e->getStatusCode());
        }

        // Rate limiting
        if ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
            return response()->json([
                'success' => false,
                'message' => 'Trop de tentatives. Veuillez patienter.',
                'error_code' => 'RATE_LIMITED',
                'retry_after' => $e->getHeaders()['Retry-After'] ?? null
            ], 429);
        }

        // Custom business logic exceptions
        if ($e instanceof \App\Exceptions\InsufficientFundsException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'INSUFFICIENT_FUNDS'
            ], 422);
        }

        if ($e instanceof \App\Exceptions\InvalidStakingPackageException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'INVALID_STAKING_PACKAGE'
            ], 422);
        }

        if ($e instanceof \App\Exceptions\ClaimNotAllowedException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'CLAIM_NOT_ALLOWED'
            ], 422);
        }

        // Database connection errors
        if ($e instanceof \Illuminate\Database\QueryException) {
            \Log::error('Database error', [
                'message' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);

            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? 
                    'Erreur de base de données: ' . $e->getMessage() : 
                    'Erreur de base de données',
                'error_code' => 'DATABASE_ERROR'
            ], 500);
        }

        // General server errors
        \Log::error('Unhandled exception', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'message' => config('app.debug') ? 
                $e->getMessage() : 
                'Erreur interne du serveur',
            'error_code' => 'INTERNAL_SERVER_ERROR',
            'debug' => config('app.debug') ? [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString())
            ] : null
        ], 500);
    }
}