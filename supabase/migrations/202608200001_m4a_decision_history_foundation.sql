BEGIN;

CREATE TABLE analysis_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), snapshot_key text NOT NULL UNIQUE,
  data_as_of_time timestamptz NOT NULL, analysis_time timestamptz NOT NULL,
  market_score numeric, market_status text NOT NULL, market_confidence numeric,
  macro_score numeric, macro_status text NOT NULL, macro_confidence numeric,
  risk_score numeric, risk_level text NOT NULL, risk_confidence numeric,
  raw_regime text NOT NULL, stable_regime text NOT NULL, market_risk_adjusted_score numeric,
  divergence_status text NOT NULL, divergence_direction text NOT NULL,
  m2_config_versions jsonb NOT NULL, domain_scores jsonb NOT NULL, evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_snapshot_id uuid NOT NULL, run_id text NOT NULL UNIQUE,
  agent text NOT NULL, agent_version text NOT NULL, prompt_version text NOT NULL, status text NOT NULL,
  input_as_of_time timestamptz, started_at timestamptz NOT NULL, finished_at timestamptz NOT NULL,
  confidence numeric, output jsonb, errors jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_runs_snapshot_fkey FOREIGN KEY (analysis_snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE RESTRICT,
  CONSTRAINT agent_runs_agent_check CHECK (agent IN ('macro','global_market','korea_market','news','research','fundamental','risk','devils_advocate','cio'))
);
CREATE TABLE cio_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_snapshot_id uuid NOT NULL, cio_agent_run_id uuid NOT NULL UNIQUE,
  investment_stance text NOT NULL, confidence numeric NOT NULL, summary text NOT NULL, data_as_of_time timestamptz NOT NULL,
  decision_time timestamptz NOT NULL, status text NOT NULL, supporting_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  counter_evidence jsonb NOT NULL DEFAULT '[]'::jsonb, key_drivers jsonb NOT NULL DEFAULT '[]'::jsonb, key_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  agent_agreement jsonb NOT NULL DEFAULT '{}'::jsonb, unknowns jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cio_decisions_snapshot_fkey FOREIGN KEY (analysis_snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE RESTRICT,
  CONSTRAINT cio_decisions_run_fkey FOREIGN KEY (cio_agent_run_id) REFERENCES agent_runs(id) ON DELETE RESTRICT,
  CONSTRAINT cio_decisions_stance_check CHECK (investment_stance IN ('STRONGLY_CONSTRUCTIVE','CONSTRUCTIVE','NEUTRAL','DEFENSIVE','STRONGLY_DEFENSIVE','UNKNOWN'))
);
CREATE TABLE cio_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cio_decision_id uuid NOT NULL, scenario_type text NOT NULL, description text NOT NULL,
  status text, required_conditions jsonb NOT NULL DEFAULT '[]'::jsonb, supporting_evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  invalidation_conditions jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cio_scenarios_decision_fkey FOREIGN KEY (cio_decision_id) REFERENCES cio_decisions(id) ON DELETE RESTRICT,
  CONSTRAINT cio_scenarios_type_check CHECK (scenario_type IN ('BASE','BULL','BEAR')),
  CONSTRAINT cio_scenarios_decision_type_unique UNIQUE (cio_decision_id,scenario_type)
);
CREATE TABLE decision_invalidation_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cio_decision_id uuid NOT NULL, condition_type text NOT NULL, description text NOT NULL,
  priority smallint, related_evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invalidation_decision_fkey FOREIGN KEY (cio_decision_id) REFERENCES cio_decisions(id) ON DELETE RESTRICT,
  CONSTRAINT invalidation_type_check CHECK (condition_type IN ('REGIME_CHANGE','RISK_CHANGE','DIVERGENCE_CHANGE','MACRO_CHANGE','MARKET_CHANGE','FUNDAMENTAL_UPDATE','EVENT_CONFIRMATION','DATA_UPDATE','OTHER'))
);
CREATE TABLE decision_monitoring_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cio_decision_id uuid NOT NULL, monitor_type text NOT NULL, label text NOT NULL,
  priority smallint, related_evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monitoring_decision_fkey FOREIGN KEY (cio_decision_id) REFERENCES cio_decisions(id) ON DELETE RESTRICT
);
CREATE INDEX analysis_snapshots_asof_idx ON analysis_snapshots(data_as_of_time DESC); CREATE INDEX analysis_snapshots_regime_asof_idx ON analysis_snapshots(stable_regime,data_as_of_time DESC); CREATE INDEX agent_runs_snapshot_idx ON agent_runs(analysis_snapshot_id); CREATE INDEX agent_runs_agent_started_idx ON agent_runs(agent,started_at DESC); CREATE INDEX cio_decisions_time_idx ON cio_decisions(decision_time DESC); CREATE INDEX cio_decisions_stance_time_idx ON cio_decisions(investment_stance,decision_time DESC); CREATE INDEX cio_scenarios_decision_idx ON cio_scenarios(cio_decision_id); CREATE INDEX invalidation_decision_idx ON decision_invalidation_conditions(cio_decision_id); CREATE INDEX monitoring_decision_idx ON decision_monitoring_priorities(cio_decision_id);
COMMIT;
