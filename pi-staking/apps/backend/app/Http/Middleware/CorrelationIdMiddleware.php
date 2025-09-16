<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CorrelationIdMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $requestId = $request->headers->get('X-Request-Id') ?: (string) Str::uuid();
        $traceId = $request->headers->get('X-Trace-Id') ?: $requestId;

        $request->headers->set('X-Request-Id', $requestId);
        $request->attributes->set('request_id', $requestId);
        $request->attributes->set('trace_id', $traceId);
        $request->attributes->set('request_start_ts', microtime(true));

        Log::withContext([
            'request_id' => $requestId,
            'trace_id' => $traceId,
            'ip' => $request->ip(),
            'user_id' => optional($request->user())->id,
            'path' => $request->path(),
            'method' => $request->method(),
        ]);

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
