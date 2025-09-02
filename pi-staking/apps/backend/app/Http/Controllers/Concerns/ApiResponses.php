<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

trait ApiResponses
{
    protected function success(array|object|null $data = null, string $message = 'OK', int $status = 200, array $meta = []): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
        ];
        if ($data !== null) {
            $payload['data'] = $data;
        }
        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }
        return response()->json($payload, $status);
    }

    protected function fail(string $message = 'Erreur', int $status = 400, array|object|null $errors = null, ?string $code = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];
        if ($errors !== null) {
            $payload['errors'] = $errors;
        }
        if ($code) {
            $payload['code'] = $code;
        }
        return response()->json($payload, $status);
    }

    protected function paginated(LengthAwarePaginator $paginator, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], $status);
    }

    protected function exception(\Throwable $e, string $fallbackMessage = 'Erreur interne du serveur', int $status = 500): JsonResponse
    {
        $isDebug = (bool) config('app.debug');
        return response()->json([
            'success' => false,
            'message' => $fallbackMessage,
            'error' => $isDebug ? $e->getMessage() : null,
        ], $status);
    }
}
