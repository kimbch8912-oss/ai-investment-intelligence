import { createServerSupabaseClient } from '../../supabase/server-client.ts';
import type { FundamentalDataSnapshot } from '../types.ts';

export type FundamentalWriteResult = { action: 'INSERTED' | 'SKIPPED'; id: string };
export type UsableSnapshotInput = { assetId: string; sourceId: string; analysisTime: string };

export class FundamentalRepository {
  private readonly db = createServerSupabaseClient();

  async findLatestUsableSnapshot(input: UsableSnapshotInput) {
    const result = await this.db.from('fundamental_snapshots').select('*').eq('asset_id', input.assetId).eq('source_id', input.sourceId).lte('data_as_of', input.analysisTime).order('data_as_of', { ascending: false }).order('retrieved_at', { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw Error(result.error.message);
    return result.data;
  }

  async latest(assetId: string, sourceId: string) {
    const result = await this.db.from('fundamental_snapshots').select('*').eq('asset_id', assetId).eq('source_id', sourceId).order('retrieved_at', { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw Error(result.error.message);
    return result.data;
  }

  private async existing(assetId: string, sourceId: string, fiscalPeriod: string | null, dataAsOf: string) {
    let query = this.db.from('fundamental_snapshots').select('id').eq('asset_id', assetId).eq('source_id', sourceId).eq('data_as_of', dataAsOf);
    query = fiscalPeriod === null ? query.is('fiscal_period', null) : query.eq('fiscal_period', fiscalPeriod);
    const result = await query.maybeSingle();
    if (result.error) throw Error(result.error.message);
    return result.data;
  }

  async insert(assetId: string, sourceId: string, data: FundamentalDataSnapshot, retrievedAt: string): Promise<FundamentalWriteResult> {
    const metrics = data.metrics, snapshot = data.snapshot, fiscalPeriod = snapshot.reportingPeriod.periodEnd ?? null;
    const previous = await this.existing(assetId, sourceId, fiscalPeriod, snapshot.asOfTime);
    if (previous) return { action: 'SKIPPED', id: previous.id };
    const result = await this.db.from('fundamental_snapshots').insert({ asset_id: assetId, source_id: sourceId, fiscal_period: fiscalPeriod, period_end: snapshot.reportingPeriod.periodEnd, data_as_of: snapshot.asOfTime, retrieved_at: retrievedAt, revenue_growth: metrics.revenueGrowth, operating_income_growth: metrics.operatingIncomeGrowth, net_income_growth: metrics.netIncomeGrowth, eps_growth: metrics.epsGrowth, operating_margin: metrics.operatingMargin, net_margin: metrics.netMargin, roe: metrics.roe, operating_cash_flow: metrics.operatingCashFlow, free_cash_flow: metrics.freeCashFlow, free_cash_flow_margin: metrics.freeCashFlowMargin, cash: metrics.cash, total_debt: metrics.totalDebt, debt_to_equity: metrics.debtToEquity, net_debt: metrics.netDebt, pe: metrics.pe, pb: metrics.pb, ev_ebitda: metrics.evEbitda, data_quality: snapshot.quality.status, confidence: snapshot.quality.confidence, evidence: snapshot.evidence }).select('id').single();
    if (!result.error) return { action: 'INSERTED', id: result.data.id };
    if (result.error.code === '23505') { const winner = await this.existing(assetId, sourceId, fiscalPeriod, snapshot.asOfTime); if (winner) return { action: 'SKIPPED', id: winner.id }; }
    throw Error(result.error.message);
  }
}
