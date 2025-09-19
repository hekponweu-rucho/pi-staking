Minimal e2e path: staking flow

Prereqs
- Seeded environment with demo user and staking packages.
- Backend API reachable at VITE_API_BASE_URL + /api.

Happy path
1) Login
   - Use the demo user seeded by DemoDataSeeder.
   - After login, you land on the dashboard.

2) See packages
   - Navigate to the staking section or scroll to packages.
   - Packages container has data-testid="staking-packages".
   - Grid of packages has data-testid="packages-grid".
   - If there are no active packages, an empty state appears with data-testid="packages-empty" and a retry CTA data-testid="packages-retry-btn".

3) Invest
   - For a package card, the primary CTA has data-testid="invest-cta-{packageId}".
   - Click it to open the modal.
   - In step 1, proceed with data-testid="continue-invest-btn" (disabled until amount >= min_amount and <= balance).
   - In step 2 (confirmation), confirm with data-testid="confirm-invest-btn".
   - On success, a toast appears and the success step is shown.

4) Confirm in portfolio
   - Go to RealTimeInvestments. The container has data-testid="realtime-investments".
   - The table has data-testid="realtime-investments-table".
   - The new investment row should appear with status badge "Actif" and the daily rate.

Instrumentation
- Console events: packages_loaded, invest_clicked, invest_success, invest_error, investments_loaded, investments_error.

Email verification (guard)
- If blocked by email verification, an inline CTA is available with data-testid="resend-verification-btn" to resend the verification email.

API endpoints used
- GET /staking/packages
- POST /staking/invest
- GET /staking/investments
