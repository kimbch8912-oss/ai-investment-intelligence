BEGIN;
CREATE TABLE fundamental_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE RESTRICT, source_id uuid NOT NULL REFERENCES system_sources(id) ON DELETE RESTRICT, fiscal_period text, period_end date, data_as_of timestamptz NOT NULL, retrieved_at timestamptz NOT NULL,
 revenue_growth numeric, operating_income_growth numeric, net_income_growth numeric, eps_growth numeric, operating_margin numeric, net_margin numeric, roe numeric, operating_cash_flow numeric, free_cash_flow numeric, free_cash_flow_margin numeric, cash numeric, total_debt numeric, debt_to_equity numeric, net_debt numeric, pe numeric, pb numeric, ev_ebitda numeric,
 data_quality text NOT NULL CHECK (data_quality IN ('COMPLETE','PARTIAL','INSUFFICIENT')), confidence numeric, evidence jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fundamental_snapshots_identity_unique ON fundamental_snapshots(asset_id, source_id, COALESCE(fiscal_period, E'\\u0000'), data_as_of);
CREATE INDEX fundamental_snapshots_asset_asof_idx ON fundamental_snapshots(asset_id, data_as_of DESC);
CREATE INDEX fundamental_snapshots_asset_period_idx ON fundamental_snapshots(asset_id, fiscal_period);
CREATE INDEX fundamental_snapshots_source_idx ON fundamental_snapshots(source_id);
CREATE TABLE news_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL REFERENCES system_sources(id) ON DELETE RESTRICT, provider_document_id text, document_key text NOT NULL UNIQUE, source_tier text NOT NULL CHECK (source_tier IN ('S','A','B','C','D')), title text NOT NULL, summary text, url text, published_at timestamptz NOT NULL, retrieved_at timestamptz NOT NULL, categories jsonb NOT NULL DEFAULT '[]'::jsonb, affected_assets jsonb NOT NULL DEFAULT '[]'::jsonb, facts jsonb NOT NULL DEFAULT '[]'::jsonb, duplicate_group text, status text NOT NULL CHECK (status IN ('READY','PARTIAL','FAILED','UNAVAILABLE','UNKNOWN')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX news_documents_source_provider_unique ON news_documents(source_id, provider_document_id) WHERE provider_document_id IS NOT NULL;
CREATE INDEX news_documents_published_idx ON news_documents(published_at DESC);
CREATE INDEX news_documents_source_published_idx ON news_documents(source_id, published_at DESC);
CREATE INDEX news_documents_duplicate_group_idx ON news_documents(duplicate_group);
ALTER TABLE fundamental_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_documents ENABLE ROW LEVEL SECURITY;
COMMIT;
