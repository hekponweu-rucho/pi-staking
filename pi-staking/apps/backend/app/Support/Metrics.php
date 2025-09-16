<?php

namespace App\Support;

class Metrics
{
    private static function path(): string
    {
        $dir = storage_path('app/metrics');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return $dir . '/metrics.json';
    }

    private static function read(): array
    {
        $path = self::path();
        if (!file_exists($path)) {
            return ['counters' => [], 'histograms' => []];
        }
        $content = @file_get_contents($path);
        if ($content === false || $content === '') {
            return ['counters' => [], 'histograms' => []];
        }
        $json = json_decode($content, true);
        return is_array($json) ? $json : ['counters' => [], 'histograms' => []];
    }

    private static function write(array $data): void
    {
        $path = self::path();
        $fp = fopen($path, 'c+');
        if (!$fp) {
            return;
        }
        try {
            flock($fp, LOCK_EX);
            ftruncate($fp, 0);
            fwrite($fp, json_encode($data));
        } finally {
            fflush($fp);
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }

    public static function inc(string $name, array $labels = [], int $value = 1): void
    {
        $data = self::read();
        $key = $name;
        $labelKey = self::labelKey($labels);
        if (!isset($data['counters'][$key])) {
            $data['counters'][$key] = [];
        }
        if (!isset($data['counters'][$key][$labelKey])) {
            $data['counters'][$key][$labelKey] = ['labels' => $labels, 'value' => 0];
        }
        $data['counters'][$key][$labelKey]['value'] += $value;
        self::write($data);
    }

    public static function observeHistogram(string $name, float $valueMs, array $labels = [], array $buckets = [50,100,250,500,1000,2500,5000,10000]): void
    {
        $data = self::read();
        if (!isset($data['histograms'][$name])) {
            $data['histograms'][$name] = [
                'buckets' => $buckets,
                'series' => []
            ];
        }
        $labelKey = self::labelKey($labels);
        if (!isset($data['histograms'][$name]['series'][$labelKey])) {
            $data['histograms'][$name]['series'][$labelKey] = [
                'labels' => $labels,
                'counts' => array_fill_keys(array_map('strval', $data['histograms'][$name]['buckets']), 0),
                'inf' => 0,
                'sum' => 0,
                'count' => 0,
            ];
        }
        $series = &$data['histograms'][$name]['series'][$labelKey];
        $bucketed = false;
        foreach ($data['histograms'][$name]['buckets'] as $b) {
            if ($valueMs <= $b) {
                $series['counts'][(string)$b]++;
                $bucketed = true;
                break;
            }
        }
        if (!$bucketed) {
            $series['inf']++;
        }
        $series['sum'] += $valueMs;
        $series['count']++;
        self::write($data);
    }

    public static function renderPrometheus(): string
    {
        $data = self::read();
        $lines = [];
        foreach ($data['counters'] as $name => $labelMap) {
            $lines[] = "# TYPE {$name} counter";
            foreach ($labelMap as $series) {
                $labels = self::formatLabels($series['labels']);
                $lines[] = sprintf("%s%s %d", $name, $labels, $series['value']);
            }
        }
        foreach ($data['histograms'] as $name => $hist) {
            $lines[] = "# TYPE {$name} histogram";
            $buckets = $hist['buckets'];
            foreach ($hist['series'] as $series) {
                $labelsBase = $series['labels'];
                $cumulative = 0;
                foreach ($buckets as $b) {
                    $cumulative += $series['counts'][(string)$b] ?? 0;
                    $labels = $labelsBase;
                    $labels['le'] = (string)$b;
                    $lines[] = sprintf("%s_bucket%s %d", $name, self::formatLabels($labels), $cumulative);
                }
                $cumulative += $series['inf'] ?? 0;
                $labelsInf = $labelsBase;
                $labelsInf['le'] = '+Inf';
                $lines[] = sprintf("%s_bucket%s %d", $name, self::formatLabels($labelsInf), $cumulative);
                $lines[] = sprintf("%s_sum%s %.0f", $name, self::formatLabels($labelsBase), $series['sum']);
                $lines[] = sprintf("%s_count%s %d", $name, self::formatLabels($labelsBase), $series['count']);
            }
        }
        return implode("\n", $lines) . "\n";
    }

    private static function labelKey(array $labels): string
    {
        ksort($labels);
        return md5(json_encode($labels));
    }

    private static function formatLabels(array $labels): string
    {
        if (empty($labels)) {
            return '';
        }
        $parts = [];
        foreach ($labels as $k => $v) {
            $parts[] = $k . '="' . str_replace('"', '\\"', (string)$v) . '"';
        }
        return '{' . implode(',', $parts) . '}';
    }
}
