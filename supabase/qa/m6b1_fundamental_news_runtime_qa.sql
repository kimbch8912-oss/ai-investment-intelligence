BEGIN;
-- Run against DEV with privileged SQL.  Every fixture is rolled back.
DO $$ DECLARE a uuid; s uuid; f uuid; n uuid; BEGIN
 INSERT INTO assets(symbol,name,asset_type,exchange,country,currency,timezone) VALUES ('M6B1QA','M6B1 QA','STOCK','NASDAQ','US','USD','America/New_York') RETURNING id INTO a;
 INSERT INTO system_sources(code,name,source_type,category,country,tier,credential_env_key) VALUES ('M6B1_QA','M6B1 QA','MARKET_DATA','MARKET_DATA','US','B','NONE') RETURNING id INTO s;
 INSERT INTO fundamental_snapshots(asset_id,source_id,fiscal_period,data_as_of,retrieved_at,data_quality,evidence,revenue_growth) VALUES(a,s,NULL,'2026-01-01','2026-01-01','COMPLETE','[{"id":"e"}]',1.2) RETURNING id INTO f;
 IF (SELECT revenue_growth FROM fundamental_snapshots WHERE id=f) <> 1.2 THEN RAISE EXCEPTION 'fundamental round trip failed'; END IF;
 BEGIN INSERT INTO fundamental_snapshots(asset_id,source_id,fiscal_period,data_as_of,retrieved_at,data_quality) VALUES(a,s,NULL,'2026-01-01','2026-01-01','COMPLETE'); RAISE EXCEPTION 'duplicate allowed'; EXCEPTION WHEN unique_violation THEN END;
 INSERT INTO fundamental_snapshots(asset_id,source_id,fiscal_period,data_as_of,retrieved_at,data_quality) VALUES(a,s,'2026-Q1','2026-02-01','2026-02-01','PARTIAL');
 INSERT INTO news_documents(source_id,document_key,source_tier,title,published_at,retrieved_at,categories,affected_assets,facts,status) VALUES(s,'m6b1-qa','B','QA','2026-01-01','2026-01-01','["x"]','[{"symbol":"M6B1QA"}]','[{"id":"f"}]','READY') RETURNING id INTO n;
 BEGIN INSERT INTO news_documents(source_id,document_key,source_tier,title,published_at,retrieved_at,status) VALUES(s,'m6b1-qa','B','QA','2026-01-01','2026-01-01','READY'); RAISE EXCEPTION 'news duplicate allowed'; EXCEPTION WHEN unique_violation THEN END;
 BEGIN INSERT INTO news_documents(source_id,document_key,source_tier,title,published_at,retrieved_at,status) VALUES(s,'bad-tier','X','QA','2026-01-01','2026-01-01','READY'); RAISE EXCEPTION 'tier allowed'; EXCEPTION WHEN check_violation THEN END;
 BEGIN DELETE FROM system_sources WHERE id=s; RAISE EXCEPTION 'restrict failed'; EXCEPTION WHEN foreign_key_violation THEN END;
END $$;
ROLLBACK;
