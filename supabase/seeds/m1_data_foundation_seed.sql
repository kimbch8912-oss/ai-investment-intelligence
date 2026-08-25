-- Design-only M1-C seed. Do not apply until reviewed.
BEGIN;

INSERT INTO system_sources (
  code, name, source_type, category, country, tier, credential_env_key
) VALUES
  ('FRED', 'Federal Reserve Economic Data', 'CENTRAL_BANK_DATA', 'MACRO', 'US', 'S', 'FRED_API_KEY'),
  ('ECOS', 'Bank of Korea Economic Statistics System', 'CENTRAL_BANK_DATA', 'MACRO', 'KR', 'S', 'ECOS_API_KEY')
ON CONFLICT (code) DO NOTHING;

INSERT INTO assets (symbol, name, asset_type, exchange, country, currency, timezone)
SELECT v.symbol, v.name, v.asset_type, v.exchange, v.country, v.currency, v.timezone
FROM (VALUES
  ('SPX', 'S&P 500', 'INDEX', 'S&P DJI', 'US', 'USD', 'America/New_York'),
  ('IXIC', 'NASDAQ Composite', 'INDEX', 'NASDAQ', 'US', 'USD', 'America/New_York'),
  ('NDX', 'NASDAQ 100', 'INDEX', 'NASDAQ', 'US', 'USD', 'America/New_York'),
  ('DJI', 'Dow Jones Industrial Average', 'INDEX', 'S&P DJI', 'US', 'USD', 'America/New_York'),
  ('RUT', 'Russell 2000', 'INDEX', 'FTSE Russell', 'US', 'USD', 'America/New_York'),
  ('US2Y', 'US 2-Year Treasury Yield', 'BOND', 'US Treasury', 'US', 'USD', 'America/New_York'),
  ('US10Y', 'US 10-Year Treasury Yield', 'BOND', 'US Treasury', 'US', 'USD', 'America/New_York'),
  ('DXY', 'US Dollar Index', 'INDEX', 'ICE', 'US', 'USD', 'America/New_York'),
  ('XAUUSD', 'Gold Spot', 'COMMODITY', 'GLOBAL', 'US', 'USD', 'America/New_York'),
  ('WTI', 'WTI Crude Oil', 'COMMODITY', 'NYMEX', 'US', 'USD', 'America/New_York'),
  ('BTCUSD', 'Bitcoin / US Dollar', 'CRYPTO', 'CRYPTO', 'US', 'USD', 'UTC'),
  ('KOSPI', 'KOSPI', 'INDEX', 'KRX', 'KR', 'KRW', 'Asia/Seoul'),
  ('KOSDAQ', 'KOSDAQ', 'INDEX', 'KRX', 'KR', 'KRW', 'Asia/Seoul'),
  ('USDKRW', 'US Dollar / Korean Won', 'FX', 'FX', 'KR', 'KRW', 'Asia/Seoul'),
  ('005930', 'Samsung Electronics', 'STOCK', 'KRX', 'KR', 'KRW', 'Asia/Seoul'),
  ('000660', 'SK hynix', 'STOCK', 'KRX', 'KR', 'KRW', 'Asia/Seoul')
) AS v(symbol, name, asset_type, exchange, country, currency, timezone)
WHERE NOT EXISTS (
  SELECT 1 FROM assets a
  WHERE a.symbol = v.symbol
    AND a.name = v.name
    AND a.asset_type = v.asset_type
    AND a.exchange = v.exchange
    AND a.country = v.country
    AND a.currency = v.currency
    AND a.timezone = v.timezone
);

INSERT INTO economic_series (
  source_id, source_series_id, name, country, frequency, unit, seasonal_adjustment, description
)
SELECT s.id, v.source_series_id, v.name, 'US', v.frequency, v.unit, v.seasonal_adjustment, v.description
FROM system_sources s
CROSS JOIN (VALUES
  ('FEDFUNDS', 'Federal Funds Effective Rate', 'Monthly', 'Percent', 'Not Seasonally Adjusted', 'Effective federal funds rate'),
  ('DGS2', 'Market Yield on U.S. Treasury Securities at 2-Year Constant Maturity', 'Daily', 'Percent', 'Not Seasonally Adjusted', '2-year Treasury constant maturity yield'),
  ('DGS10', 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity', 'Daily', 'Percent', 'Not Seasonally Adjusted', '10-year Treasury constant maturity yield'),
  ('T10Y2Y', '10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity', 'Daily', 'Percent', 'Not Seasonally Adjusted', '10-year minus 2-year Treasury spread'),
  ('CPIAUCSL', 'Consumer Price Index for All Urban Consumers: All Items', 'Monthly', 'Index 1982-1984=100', 'Seasonally Adjusted', 'Headline CPI level index'),
  ('CPILFESL', 'Consumer Price Index for All Urban Consumers: All Items Less Food and Energy', 'Monthly', 'Index 1982-1984=100', 'Seasonally Adjusted', 'Core CPI level index'),
  ('PCEPI', 'Personal Consumption Expenditures: Chain-type Price Index', 'Monthly', 'Index 2017=100', 'Seasonally Adjusted', 'PCE price level index'),
  ('UNRATE', 'Unemployment Rate', 'Monthly', 'Percent', 'Seasonally Adjusted', 'US unemployment rate'),
  ('PAYEMS', 'All Employees, Total Nonfarm', 'Monthly', 'Thousands of Persons', 'Seasonally Adjusted', 'US total nonfarm employment level'),
  ('GDP', 'Gross Domestic Product', 'Quarterly', 'Billions of Dollars', 'Seasonally Adjusted Annual Rate', 'US nominal gross domestic product'),
  ('M2SL', 'M2', 'Monthly', 'Billions of Dollars', 'Seasonally Adjusted', 'US M2 money stock')
) AS v(source_series_id, name, frequency, unit, seasonal_adjustment, description)
WHERE s.code = 'FRED'
ON CONFLICT (source_id, source_series_id) DO NOTHING;

COMMIT;
