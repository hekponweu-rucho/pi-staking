<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class StructuredLogger
{
    public static function event(string $event, array $data = [], string $level = 'info'): void
    {
        $request = request();
        $requestId = optional($request)->attributes->get('request_id') ?? optional($request)->header('X-Request-Id') ?? (string) Str::uuid();
        $traceId = optional($request)->attributes->get('trace_id') ?? optional($request)->header('X-Trace-Id') ?? $requestId;
        $startTs = (float) (optional($request)->attributes->get('request_start_ts') ?? 0);
        $latencyMs = $startTs ? (int) round((microtime(true) - $startTs) * 1000) : null;

        $payload = [
            'trace_id' => $data['trace_id'] ?? $traceId,
            'request_id' => $data['request_id'] ?? $requestId,
            'user_id' => $data['user_id'] ?? optional(optional($request)->user())->id,
            'investment_id' => $data['investment_id'] ?? null,
            'event' => $event,
            'outcome' => $data['outcome'] ?? 'success',
            'amount' => $data['amount'] ?? null,
            'currency' => $data['currency'] ?? 'PI',
            'latency_ms' => $data['latency_ms'] ?? $latencyMs,
            'meta' => $data['meta'] ?? null,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('daily')->{$level}($event, $payload);
    }
}
