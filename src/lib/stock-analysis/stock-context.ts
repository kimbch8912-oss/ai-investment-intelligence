import type { GlobalMarketOutput } from '../agents/global-market/types.ts';
import type { KoreaMarketOutput } from '../agents/korea-market/types.ts';
import type { MacroAgentOutput } from '../agents/macro/types.ts';
import { unknownContext, unknownIndustryContext } from './industry-context.ts';
import type { GlobalMarketStockContext, KoreaMarketStockContext, ResolvedStockAsset, StockContext } from './types.ts';

const statusOf = (status: string | undefined) => status === 'VALID' ? 'AVAILABLE' as const : status === 'PARTIAL' ? 'PARTIAL' as const : 'UNKNOWN' as const;
const unknownMetric = () => ({ value: null, status: 'UNKNOWN' as const, asOfTime: null, evidence: [] as const });
export const marketRouteFor = (asset: Pick<ResolvedStockAsset, 'market' | 'country'>): 'KOREA' | 'GLOBAL' => asset.market === 'KRX' || asset.country === 'KR' ? 'KOREA' : 'GLOBAL';

export function createStockContext(asset: ResolvedStockAsset, input: { koreaMarket?: KoreaMarketOutput | null; globalMarket?: GlobalMarketOutput | null; macro?: MacroAgentOutput | null } = {}): StockContext {
  const unknown = unknownContext();
  const route = marketRouteFor(asset);
  const koreaMarketContext: KoreaMarketStockContext | typeof unknown = route === 'KOREA' && input.koreaMarket
    ? { route: 'KOREA', market: input.koreaMarket, status: statusOf(input.koreaMarket.status), confidence: input.koreaMarket.confidence, asOfTime: input.koreaMarket.dataAsOfTime, evidence: [...input.koreaMarket.evidence] }
    : unknown;
  const globalMarketContext: GlobalMarketStockContext | typeof unknown = route === 'GLOBAL' && input.globalMarket
    ? { route: 'GLOBAL', market: input.globalMarket, status: statusOf(input.globalMarket.status), confidence: input.globalMarket.confidence, asOfTime: input.globalMarket.dataAsOfTime, evidence: [...input.globalMarket.evidence] }
    : unknown;
  const macro = input.macro;
  return {
    asset,
    priceContext: { status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], price: null, volume: null },
    technicalContext: { status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], price: unknownMetric(), volume: unknownMetric(), return1D: unknownMetric(), return5D: unknownMetric(), return20D: unknownMetric(), ma20: unknownMetric(), ma60: unknownMetric(), ma120: unknownMetric(), priceVsMa20: unknownMetric(), priceVsMa60: unknownMetric(), priceVsMa120: unknownMetric(), rsi14: unknownMetric(), realizedVolatility: unknownMetric(), drawdown: unknownMetric(), maxDrawdown: unknownMetric(), volumeChange: unknownMetric(), volumeMa20: unknownMetric(), supportLevels: unknownMetric(), resistanceLevels: unknownMetric() },
    fundamentalContext: { status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], snapshot: null },
    industryContext: unknownIndustryContext(),
    koreaMarketContext,
    globalMarketContext,
    macroContext: macro ? { status: statusOf(macro.status), confidence: macro.confidence, asOfTime: macro.dataAsOfTime, evidence: [...macro.evidence], macro } : { status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], macro: null },
    newsContext: { status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], items: [], unknowns: ['news provider is not connected'] },
    researchContext: { status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], items: [], unknowns: ['research provider is not connected'] },
  };
}
