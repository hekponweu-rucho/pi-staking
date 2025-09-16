<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ObservabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_metrics_endpoint_requires_token_when_configured(): void
    {
        config(['metrics.enabled' => true, 'metrics.token' => 'secret']);

        $resp = $this->get('/api/metrics');
        $resp->assertStatus(403);

        // Simulate some metrics
        \App\Support\Metrics::inc('claims_processed_total');
        \App\Support\Metrics::observeHistogram('process_daily_earnings_duration_ms', 123);

        $resp = $this->get('/api/metrics', ['X-Metrics-Token' => 'secret']);
        $resp->assertOk();
        $text = $resp->getContent();
        $this->assertStringContainsString('claims_processed_total', $text);
        $this->assertStringContainsString('process_daily_earnings_duration_ms_bucket', $text);
    }
}
