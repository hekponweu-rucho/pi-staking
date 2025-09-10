<?php

namespace App\Services\DepositWatcher;

use Illuminate\Support\Facades\Http;

class ApiProvider implements PiDepositProviderInterface
{
    public function findIncomingForAddresses(array $addresses): array
    {
        $url = config('deposits.pi_api_url');
        $key = config('deposits.pi_api_key');
        if (!$url || !$key) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $key,
                'Accept' => 'application/json',
            ])->post(rtrim($url, '/') . '/incoming', [
                'addresses' => array_values($addresses),
            ]);

            if (!$response->ok()) {
                return [];
            }

            $data = $response->json();
            return is_array($data) ? $data : [];
        } catch (\Throwable $e) {
            return [];
        }
    }
}