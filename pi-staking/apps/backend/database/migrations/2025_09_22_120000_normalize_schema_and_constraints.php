<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        // withdrawal_requests: ensure authoritative schema, add missing columns, indexes, checks
        if (Schema::hasTable('withdrawal_requests')) {
            Schema::table('withdrawal_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('withdrawal_requests', 'withdrawal_address')) {
                    $table->string('withdrawal_address')->nullable()->after('destination_type');
                }
                if (!Schema::hasColumn('withdrawal_requests', 'note')) {
                    $table->text('note')->nullable()->after('withdrawal_address');
                }
                if (!Schema::hasColumn('withdrawal_requests', 'requested_at')) {
                    $table->timestamp('requested_at')->nullable()->after('note');
                }
                if (!Schema::hasColumn('withdrawal_requests', 'status')) {
                    $table->string('status')->default('pending');
                }
                if (!Schema::hasColumn('withdrawal_requests', 'amount')) {
                    $table->decimal('amount', 20, 8);
                }
                if (!Schema::hasColumn('withdrawal_requests', 'user_id')) {
                    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                }
                $table->index(['user_id', 'status'], 'withdrawals_user_status');
            });

            if (in_array($driver, ['pgsql', 'mysql', 'sqlite'])) {
                try {
                    if ($driver === 'pgsql') {
                        DB::statement("ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_amount_positive");
                        DB::statement("ALTER TABLE withdrawal_requests ADD CONSTRAINT withdrawal_requests_amount_positive CHECK (amount > 0)");
                    } else {
                        Schema::table('withdrawal_requests', function (Blueprint $table) {
                            $table->check('amount > 0', name: 'withdrawal_requests_amount_positive');
                        });
                    }
                } catch (\Throwable $e) {
                }
            }
        }

        // investments: amount > 0, daily_rate between 0 and 1, ensure indexes
        if (Schema::hasTable('investments')) {
            if (in_array($driver, ['pgsql', 'mysql', 'sqlite'])) {
                try {
                    if ($driver === 'pgsql') {
                        DB::statement("ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_amount_positive");
                        DB::statement("ALTER TABLE investments ADD CONSTRAINT investments_amount_positive CHECK (amount > 0)");
                        DB::statement("ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_daily_rate_range");
                        DB::statement("ALTER TABLE investments ADD CONSTRAINT investments_daily_rate_range CHECK (daily_rate >= 0 AND daily_rate <= 1)");
                    } else {
                        Schema::table('investments', function (Blueprint $table) {
                            $table->check('amount > 0', name: 'investments_amount_positive');
                            $table->check('daily_rate >= 0 AND daily_rate <= 1', name: 'investments_daily_rate_range');
                        });
                    }
                } catch (\Throwable $e) {
                }
            }
            Schema::table('investments', function (Blueprint $table) {
                $table->index(['user_id', 'status'], 'investments_user_status');
                $table->index(['status', 'end_at'], 'investments_status_end_at');
                $table->index(['next_claim_at'], 'investments_next_claim_at');
            });
        }

        // transactions: idempotency_key unique, performance index
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('transactions', 'idempotency_key')) {
                    $table->string('idempotency_key', 100)->nullable()->after('admin_notes');
                }
            });
            try {
                Schema::table('transactions', function (Blueprint $table) {
                    $table->unique('idempotency_key', 'transactions_idempotency_key_unique');
                });
            } catch (\Throwable $e) {
            }
            Schema::table('transactions', function (Blueprint $table) {
                $table->index(['user_id', 'created_at'], 'transactions_user_created_at');
            });
        }

        // claims: enforce positive amounts and performance index
        if (Schema::hasTable('claims')) {
            if (in_array($driver, ['pgsql', 'mysql', 'sqlite'])) {
                try {
                    if ($driver === 'pgsql') {
                        DB::statement("ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_final_amount_positive");
                        DB::statement("ALTER TABLE claims ADD CONSTRAINT claims_final_amount_positive CHECK (final_amount > 0)");
                        DB::statement("ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_base_amount_nonneg");
                        DB::statement("ALTER TABLE claims ADD CONSTRAINT claims_base_amount_nonneg CHECK (base_amount >= 0)");
                        DB::statement("ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_bonus_amount_nonneg");
                        DB::statement("ALTER TABLE claims ADD CONSTRAINT claims_bonus_amount_nonneg CHECK (bonus_amount >= 0)");
                    } else {
                        Schema::table('claims', function (Blueprint $table) {
                            $table->check('final_amount > 0', name: 'claims_final_amount_positive');
                            $table->check('base_amount >= 0', name: 'claims_base_amount_nonneg');
                            $table->check('bonus_amount >= 0', name: 'claims_bonus_amount_nonneg');
                        });
                    }
                } catch (\Throwable $e) {
                }
            }
            Schema::table('claims', function (Blueprint $table) {
                $table->index(['user_id', 'created_at'], 'claims_user_created_at');
            });
        }

        // deposits: ensure amount > 0 when not null, unique tx_hash already exists, keep idempotent
        if (Schema::hasTable('deposits')) {
            if (in_array($driver, ['pgsql', 'mysql', 'sqlite'])) {
                try {
                    if ($driver === 'pgsql') {
                        DB::statement("ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_amount_positive");
                        DB::statement("ALTER TABLE deposits ADD CONSTRAINT deposits_amount_positive CHECK (amount IS NULL OR amount > 0)");
                    } else {
                        Schema::table('deposits', function (Blueprint $table) {
                            $table->check('amount IS NULL OR amount > 0', name: 'deposits_amount_positive');
                        });
                    }
                } catch (\Throwable $e) {
                }
            }
        }

        // staking_packages: rate between 0 and 1, duration_days > 0
        if (Schema::hasTable('staking_packages')) {
            if (in_array($driver, ['pgsql', 'mysql', 'sqlite'])) {
                try {
                    if ($driver === 'pgsql') {
                        DB::statement("ALTER TABLE staking_packages DROP CONSTRAINT IF EXISTS staking_packages_daily_rate_range");
                        DB::statement("ALTER TABLE staking_packages ADD CONSTRAINT staking_packages_daily_rate_range CHECK (daily_rate >= 0 AND daily_rate <= 1)");
                        DB::statement("ALTER TABLE staking_packages DROP CONSTRAINT IF EXISTS staking_packages_duration_days_positive");
                        DB::statement("ALTER TABLE staking_packages ADD CONSTRAINT staking_packages_duration_days_positive CHECK (duration_days > 0)");
                    } else {
                        Schema::table('staking_packages', function (Blueprint $table) {
                            $table->check('daily_rate >= 0 AND daily_rate <= 1', name: 'staking_packages_daily_rate_range');
                            $table->check('duration_days > 0', name: 'staking_packages_duration_days_positive');
                        });
                    }
                } catch (\Throwable $e) {
                }
            }
        }

        // ledger_entries: add transaction_id, line_no, unique constraint, delta non-zero
        if (Schema::hasTable('ledger_entries')) {
            Schema::table('ledger_entries', function (Blueprint $table) {
                if (!Schema::hasColumn('ledger_entries', 'transaction_id')) {
                    $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete()->after('user_id');
                }
                if (!Schema::hasColumn('ledger_entries', 'line_no')) {
                    $table->smallInteger('line_no')->nullable()->after('transaction_id');
                }
            });
            if ($driver === 'pgsql') {
                try {
                    DB::statement('DROP INDEX IF EXISTS ledger_entries_tx_line_unique');
                    DB::statement('CREATE UNIQUE INDEX ledger_entries_tx_line_unique ON ledger_entries (transaction_id, line_no) WHERE transaction_id IS NOT NULL');
                } catch (\Throwable $e) {
                }
                try {
                    DB::statement("ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_delta_nonzero");
                    DB::statement("ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_delta_nonzero CHECK (delta <> 0)");
                } catch (\Throwable $e) {
                }
            } else {
                try {
                    Schema::table('ledger_entries', function (Blueprint $table) {
                        $table->check('delta <> 0', name: 'ledger_entries_delta_nonzero');
                    });
                } catch (\Throwable $e) {
                }
            }
        }

        // verification_codes: ensure uniqueness on (user_id, action, code)
        if (Schema::hasTable('verification_codes')) {
            try {
                Schema::table('verification_codes', function (Blueprint $table) {
                    $table->unique(['user_id', 'action', 'code'], 'verification_codes_user_action_code_unique');
                });
            } catch (\Throwable $e) {
            }
        }

        // Optional: convert enum-like columns to PostgreSQL enums when running on pgsql
        if ($driver === 'pgsql') {
            $this->ensurePgEnum('withdrawal_status', ['pending','reviewing','approved','processing','completed','rejected','cancelled']);
            $this->ensurePgEnum('investment_status', ['active','completed','cancelled','paused','failed']);
            $this->ensurePgEnum('investment_source', ['funds','bonus','referral','claimable','claimable_bonus']);
            $this->ensurePgEnum('transaction_type', ['deposit','withdrawal','claim','bonus','referral','adjustment','fee','investment']);
            $this->ensurePgEnum('transaction_status', ['pending','processing','completed','failed','cancelled','reversed','rejected']);
            $this->ensurePgEnum('claim_status', ['pending','processed','failed','cancelled']);
            $this->ensurePgEnum('ledger_account', ['principal','bonus','claimable','claimable_bonus','pending_withdrawal','fees','external']);

            try {
                DB::statement("ALTER TABLE withdrawal_requests ALTER COLUMN status TYPE withdrawal_status USING status::withdrawal_status");
            } catch (\Throwable $e) {}
            try {
                DB::statement("ALTER TABLE investments ALTER COLUMN status TYPE investment_status USING status::investment_status");
            } catch (\Throwable $e) {}
            try {
                DB::statement("ALTER TABLE investments ALTER COLUMN source TYPE investment_source USING source::investment_source");
            } catch (\Throwable $e) {}
            try {
                DB::statement("ALTER TABLE transactions ALTER COLUMN type TYPE transaction_type USING type::transaction_type");
            } catch (\Throwable $e) {}
            try {
                DB::statement("ALTER TABLE transactions ALTER COLUMN status TYPE transaction_status USING status::transaction_status");
            } catch (\Throwable $e) {}
            try {
                DB::statement("ALTER TABLE claims ALTER COLUMN status TYPE claim_status USING status::claim_status");
            } catch (\Throwable $e) {}
            try {
                DB::statement("ALTER TABLE ledger_entries ALTER COLUMN account TYPE ledger_account USING account::ledger_account");
            } catch (\Throwable $e) {}
        }

        // Backfill idempotency_key where possible
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'idempotency_key')) {
            try {
                DB::statement("UPDATE transactions SET idempotency_key = CONCAT('deposit:', COALESCE(transaction_hash, '')) WHERE type = 'deposit' AND transaction_hash IS NOT NULL AND idempotency_key IS NULL");
            } catch (\Throwable $e) {}
            try {
                DB::statement("UPDATE transactions SET idempotency_key = CONCAT('withdrawal:reserve:', withdrawal_request_id) WHERE type = 'withdrawal' AND amount = 0 AND withdrawal_request_id IS NOT NULL AND idempotency_key IS NULL");
            } catch (\Throwable $e) {}
            try {
                DB::statement("UPDATE transactions SET idempotency_key = CONCAT('withdrawal:execute:', withdrawal_request_id) WHERE type = 'withdrawal' AND amount <> 0 AND withdrawal_request_id IS NOT NULL AND idempotency_key IS NULL");
            } catch (\Throwable $e) {}
        }
    }

    private function ensurePgEnum(string $name, array $values): void
    {
        $exists = DB::selectOne("SELECT 1 FROM pg_type WHERE typname = ?", [$name]);
        if (!$exists) {
            $vals = collect($values)->map(fn($v) => "'" . str_replace("'", "''", $v) . "'")->implode(',');
            DB::statement("CREATE TYPE \"$name\" AS ENUM ($vals)");
        }
    }

    public function down(): void
    {
        // No-op: schema normalization is not reversed to avoid data loss
    }
};
