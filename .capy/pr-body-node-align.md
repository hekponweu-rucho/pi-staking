## Node/TS alignment with backend staking API

Summary
- Align shared-types and frontend with Laravel backend changes.
- Standardize naming and fields used by staking, investments, and claims.

Changes
- shared-types
  - api.CreateInvestmentRequest: package_id → staking_package_id
  - investment.Investment: package_id → staking_package_id; next_claim_available_at → next_claim_at; remove effective_rate
  - investment.Claim: amount → final_amount; status now 'processed' | 'failed' | 'cancelled'
  - investment.StakingPackage: remove deposit_fee_rate/performance_fee_rate fields
  - financial.RateAdjustment: package_id → staking_package_id
- frontend
  - Replace all usages of next_claim_available_at with next_claim_at
  - Replace effective_rate with daily_rate for calculations
  - Use staking_package_id in payloads/refs; UI fallback updated
  - Remove display of deposit/performance fees from packages
  - Update claim history types/status to processed and amount → final_amount

Why
- Backend harmonization removed non-existent fields and standardized names.
- Prevent 500s and mismatches across layers.

Impact
- Type-safe alignment prevents future regressions.
- UI reflects correct next claim timing and daily calculations.

Test plan
- Build frontend and ensure type checks pass.
- Create investment → POST /api/staking/invest with staking_package_id
- Validate investments lists render rates (daily_rate) and next_claim_at timers.
- Claim flow → claims status 'processed', history uses final_amount.

Follow-ups
- Consider updating AdminDashboard types to match new backend response shape (users/investments/tvl/claims/... charts)
- Wire any additional frontend admin views to new endpoints.
