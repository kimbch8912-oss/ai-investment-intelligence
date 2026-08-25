import type { AssetIdentifierRecord, AssetRecord, ResolvedStockAsset, StockAnalysisRequest } from './types.ts';

export class StockAssetResolutionError extends Error {}

/** Resolves a single M1 STOCK asset without querying, mutating, or duplicating M1 data. */
export function resolveStockAsset(asset: AssetRecord, identifiers: readonly AssetIdentifierRecord[]): ResolvedStockAsset {
  if (asset.assetType !== 'STOCK') throw new StockAssetResolutionError('Only M1 STOCK assets are supported.');
  if (!asset.isActive || !asset.symbol || !asset.exchange) throw new StockAssetResolutionError('An active stock symbol and exchange are required.');
  const scoped = identifiers.filter((identifier) => identifier.assetId === asset.id && identifier.isActive)
    .map((identifier) => ({ ...identifier }));
  if (identifiers.some((identifier) => identifier.assetId !== asset.id)) {
    throw new StockAssetResolutionError('Unsupported extra asset identifier is outside the requested asset scope.');
  }
  return { id: asset.id, symbol: asset.symbol, name: asset.name, market: asset.exchange, country: asset.country, currency: asset.currency, timezone: asset.timezone, identifiers: scoped };
}

export function createStockAnalysisRequest(asset: ResolvedStockAsset, analysisTime: string, dataAsOfTime: string | null): StockAnalysisRequest {
  if (!analysisTime) throw new StockAssetResolutionError('analysisTime is required.');
  return { assetId: asset.id, symbol: asset.symbol, market: asset.market, analysisTime, dataAsOfTime };
}
