<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DepositAddressesSeeder extends Seeder
{
    public function run(): void
    {
        $raw = env('STAKING_PI_SEED_ADDRESSES');
        if (!$raw) {
            Log::warning('STAKING_PI_SEED_ADDRESSES is empty; no deposit addresses seeded');
            return;
        }

        $addresses = collect(explode(',', $raw))
            ->map(fn ($a) => trim($a))
            ->filter(fn ($a) => $a !== '')
            ->unique()
            ->values();

        if ($addresses->isEmpty()) {
            Log::warning('STAKING_PI_SEED_ADDRESSES parsed empty after trimming; no deposit addresses seeded');
            return;
        }

        $now = now();

        foreach ($addresses as $address) {
            $exists = DB::table('deposit_addresses')->where('address', $address)->exists();
            if (!$exists) {
                DB::table('deposit_addresses')->insert([
                    'address' => $address,
                    'is_active' => true,
                    'assigned_to_user_id' => null,
                    'assigned_at' => null,
                    'expires_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}