<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class Pagination
{
    public static function perPage(Request $request, int $default = 20, int $max = 100): int
    {
        $perPage = (int) ($request->query('per_page') ?? $request->query('limit') ?? $default);
        if ($perPage <= 0) $perPage = $default;
        if ($perPage > $max) $perPage = $max;
        return $perPage;
    }

    public static function sort(Request $request, array $whitelist, string $defaultColumn = 'created_at', string $defaultOrder = 'desc'): array
    {
        $sort = (string) $request->query('sort', $defaultColumn);
        $order = strtolower((string) $request->query('order', $defaultOrder));
        $order = $order === 'asc' ? 'asc' : 'desc';

        // Back-compat aliases
        $sortBy = (string) $request->query('sort_by', $sort);
        $sortDir = strtolower((string) $request->query('sort_dir', $order));
        $sort = $sortBy ?: $sort;
        $order = in_array($sortDir, ['asc','desc'], true) ? $sortDir : $order;

        // Secure mapping
        if (array_is_list($whitelist)) {
            // array of allowed columns
            $column = in_array($sort, $whitelist, true) ? $sort : $defaultColumn;
        } else {
            // map of alias => column
            $column = $whitelist[$sort] ?? $defaultColumn;
        }

        return [$column, $order];
    }

    public static function envelope(LengthAwarePaginator $paginator, ?string $resourceClass = null, ?Request $request = null): array
    {
        $items = $paginator->getCollection();
        if ($resourceClass) {
            // Resolve resource collection to plain array
            $data = $resourceClass::collection($items)->resolve();
        } else {
            $data = $items->toArray();
        }

        return [
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'links' => [
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
        ];
    }
}
