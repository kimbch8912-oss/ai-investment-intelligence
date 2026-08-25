import { createStockAnalysisRequest, resolveStockAsset, StockAssetResolutionError } from '../stock-analysis-request.ts';
import { createStockContext, marketRouteFor } from '../stock-context.ts';
import type { AssetRecord } from '../types.ts';

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const asset = (symbol: string, market: string, country: string): AssetRecord => ({ id: `asset-${symbol}`, symbol, name: symbol, assetType: 'STOCK', exchange: market, country, currency: country === 'KR' ? 'KRW' : 'USD', timezone: 'UTC', isActive: true });
const at = '2026-08-25T00:00:00.000Z';

const korea = resolveStockAsset(asset('005930', 'KRX', 'KR'), [{ assetId: 'asset-005930', identifierType: 'TICKER', identifierValue: '005930', isActive: true }]);
assert(marketRouteFor(korea) === 'KOREA' && createStockContext(korea).globalMarketContext.status === 'UNKNOWN', 'A Korea stock routes only to Korea context');
const us = resolveStockAsset(asset('NVDA', 'NASDAQ', 'US'), [{ assetId: 'asset-NVDA', identifierType: 'TICKER', identifierValue: 'NVDA', isActive: true }]);
assert(marketRouteFor(us) === 'GLOBAL' && createStockContext(us).koreaMarketContext.status === 'UNKNOWN', 'B US stock routes only to Global context');
const context = createStockContext(korea);
assert(context.fundamentalContext.status === 'UNKNOWN' && context.fundamentalContext.snapshot === null, 'C missing fundamental remains UNKNOWN');
assert(context.industryContext.status === 'UNKNOWN' && context.industryContext.industry === null, 'D missing industry remains UNKNOWN');
const before = JSON.stringify(korea); const request = createStockAnalysisRequest(korea, at, null);
assert(JSON.stringify(korea) === before && request.assetId === korea.id, 'E input asset remains unchanged');
try { resolveStockAsset(asset('005930', 'KRX', 'KR'), [{ assetId: 'other', identifierType: 'TICKER', identifierValue: 'NVDA', isActive: true }]); throw new Error('extra asset accepted'); } catch (error) { assert(error instanceof StockAssetResolutionError, 'F unsupported extra asset is blocked'); }
console.log('M5-A stock analysis foundation QA PASS');
