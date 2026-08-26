import type { AssetRecord, ResolvedStockAsset } from '../stock-analysis/types.ts';
import type { FundamentalDataSnapshot, IndustryDataSnapshot, MarketDataSnapshot, NewsDataSnapshot, ResearchDataSnapshot, SourceEnvelope } from './types.ts';

export interface MarketDataRequest { asset: ResolvedStockAsset; interval: '1d'; from: string; to: string; asOfTime: string; }
export interface AssetDataRequest { asset: ResolvedStockAsset; asOfTime: string; }
export interface MarketDataProvider { readonly id: string; getMarketData(request: MarketDataRequest): Promise<SourceEnvelope<MarketDataSnapshot>>; }
export interface FundamentalDataProvider { readonly id: string; getFundamentalData(request: AssetDataRequest): Promise<SourceEnvelope<FundamentalDataSnapshot>>; }
export interface IndustryDataProvider { readonly id: string; getIndustryData(request: AssetDataRequest): Promise<SourceEnvelope<IndustryDataSnapshot>>; }
export interface NewsDataProvider { readonly id: string; getNewsData(request: AssetDataRequest): Promise<SourceEnvelope<NewsDataSnapshot>>; }
export interface ResearchDataProvider { readonly id: string; getResearchData(request: AssetDataRequest): Promise<SourceEnvelope<ResearchDataSnapshot>>; }
export interface LiveDataProviders { market?: MarketDataProvider; fundamental?: FundamentalDataProvider; industry?: IndustryDataProvider; news?: NewsDataProvider; research?: ResearchDataProvider; }
export interface AssetResolver { resolve(asset: AssetRecord, identifiers: readonly import('../stock-analysis/types.ts').AssetIdentifierRecord[]): ResolvedStockAsset; }
