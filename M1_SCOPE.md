# M1 Scope — Data Foundation

## Objective

M1 moves from M0 documentation into a limited data-foundation implementation. Its purpose is to establish the minimum reliable structure for market and macro data, source management, and a basic Dashboard—not to begin the intelligence or recommendation layers.

## Included Work

- Project basic structure
- Supabase connection
- Core database migrations required for this milestone only
- Asset Master
- Market-data ingestion structure
- FRED ingestion
- ECOS ingestion
- Source management
- Basic Dashboard UI

Migrations are selected by M1 needs, not automatically created for every conceptual M0 domain. The Asset Master uses internal `asset_id` relationships. Source configuration follows the `system_sources` design and tiering guidance.

The basic Dashboard should use Korean display text and focus on the future dashboard information structure without claiming unimplemented analytics as available.

## Explicitly Excluded

- CIO Agent
- Research Agent
- Fundamental Agent
- Devil Agent
- Automated investment recommendation
- Personal portfolio
- Prediction
- Prediction evaluation
- Automated trading
- Real-time WebSocket
- Complex quant engine
- Multi-agent orchestration

Signal-engine, risk-agent, scenario, and agent functionality are later milestones unless separately approved. M1 must not add excluded work as a prerequisite-shaped expansion.

## M1 Completion Boundary

M1 is ready to hand off when the approved foundation can identify assets consistently, acquire the selected market and FRED/ECOS data through an ingestion structure, manage sources, persist the necessary core data, and expose a basic Korean Dashboard. It does not need to determine market direction, make investment calls, or assess future prediction accuracy.

## Decisions Required Before M1 Entry

1. Confirm the initial asset universe, exchanges, and market-data provider(s). The initial pipeline-validation baseline is:

   - US / Global: S&P 500, NASDAQ Composite, NASDAQ 100, Dow Jones, Russell 2000, US 2Y Treasury, US 10Y Treasury, DXY, Gold, WTI, and Bitcoin.
   - Korea: KOSPI, KOSDAQ, USD/KRW, Samsung Electronics, and SK hynix.

   M1 does not expand into collecting hundreds or thousands of individual equities.
2. Confirm Supabase project/environment and secret-management approach.
3. Confirm FRED and ECOS series lists, refresh cadence, and historical-backfill policy. Initial FRED review covers Federal Funds Rate, US 2Y Treasury Yield, US 10Y Treasury Yield, 2Y-10Y Spread, CPI, Core CPI, PCE, Unemployment Rate, Nonfarm Payroll, GDP, ISM Manufacturing, and M2. Actual FRED Series IDs are verified before M1 API implementation.

   Initial ECOS review covers Bank of Korea base rate, Consumer Price Index, GDP, USD/KRW, money supply, government bond yields, and unemployment rate. Actual ECOS statistical and item codes are verified during M1 API implementation; M0 does not guess or hardcode them.
4. Confirm M1 data-retention, correction/revision, and timezone/as-of-time conventions.
5. Confirm the initial Dashboard's exact data widgets and empty/error-state behavior.
6. Confirm source reliability/priority governance and who may enable or change a source configuration.
