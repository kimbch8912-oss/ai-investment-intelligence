BEGIN;
CREATE FUNCTION persist_cio_decision_bundle(p_snapshot uuid,p_run uuid,p_decision jsonb,p_scenarios jsonb,p_invalidations jsonb,p_monitoring jsonb) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE d uuid; x jsonb;
BEGIN
  SELECT id INTO d FROM cio_decisions WHERE cio_agent_run_id=p_run;
  IF d IS NOT NULL THEN RETURN d; END IF;
  INSERT INTO cio_decisions(analysis_snapshot_id,cio_agent_run_id,investment_stance,confidence,summary,data_as_of_time,decision_time,status,supporting_evidence,counter_evidence,key_drivers,key_risks,agent_agreement,unknowns)
  VALUES(p_snapshot,p_run,p_decision->>'investment_stance',(p_decision->>'confidence')::numeric,p_decision->>'summary',(p_decision->>'data_as_of_time')::timestamptz,(p_decision->>'decision_time')::timestamptz,p_decision->>'status',coalesce(p_decision->'supporting_evidence','[]'),coalesce(p_decision->'counter_evidence','[]'),coalesce(p_decision->'key_drivers','[]'),coalesce(p_decision->'key_risks','[]'),coalesce(p_decision->'agent_agreement','{}'),coalesce(p_decision->'unknowns','[]')) RETURNING id INTO d;
  FOR x IN SELECT value FROM jsonb_array_elements(p_scenarios) LOOP INSERT INTO cio_scenarios(cio_decision_id,scenario_type,description) VALUES(d,x->>'scenario_type',x->>'description'); END LOOP;
  FOR x IN SELECT value FROM jsonb_array_elements(p_invalidations) LOOP INSERT INTO decision_invalidation_conditions(cio_decision_id,condition_type,description) VALUES(d,x->>'condition_type',x->>'description'); END LOOP;
  FOR x IN SELECT value FROM jsonb_array_elements(p_monitoring) LOOP INSERT INTO decision_monitoring_priorities(cio_decision_id,monitor_type,label) VALUES(d,x->>'monitor_type',x->>'label'); END LOOP;
  RETURN d;
END $$;
REVOKE EXECUTE ON FUNCTION persist_cio_decision_bundle(uuid,uuid,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION persist_cio_decision_bundle(uuid,uuid,jsonb,jsonb,jsonb,jsonb) TO service_role;
COMMIT;
