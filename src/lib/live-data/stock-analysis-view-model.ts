import type { StockAnalysisFixture } from '../../dashboard/fixtures/stock-analysis-fixtures.ts';
import type { LiveDataSnapshot, SourceMode } from './types.ts';
import type { StockDataHealth } from './data-health.ts';
import { health, stockHealth } from './data-health.ts';

/** Deliberately structural: the existing Dashboard can consume either fixture or future live view data. */
export type StockAnalysisViewModel = StockAnalysisFixture & { sourceMode: SourceMode; sourceCoverage: number; sourceStatuses: Readonly<Record<string, string>>; dataHealth?: StockDataHealth; liveSource?: string; liveFreshness?: string; liveDataAsOfTime?: string | null; liveSources?: ReadonlyArray<{ name: string; status: string; freshness?: string }>; newsArticles?: ReadonlyArray<{ title: string; source: string; publishedAt: string; sentiment: string; importance: string; url: string }>; aiReport?: { status: 'COMPLETED' | 'FAILED'; oneLine?: string; sections?: ReadonlyArray<[string, string]> }; };
export function fixtureToStockAnalysisViewModel(fixture: StockAnalysisFixture): StockAnalysisViewModel {
  return { ...fixture, chart: fixture.chart.map((point) => ({ ...point })), sourceMode: 'FIXTURE', sourceCoverage: 1, sourceStatuses: {} };
}
/** Live presentation is intentionally incomplete until M5-K supplies the existing M5-F/G output adapter. */
export function liveDataMetadata(snapshot: LiveDataSnapshot) {
  return { sourceMode: 'LIVE' as const, sourceCoverage: snapshot.coverage.ratio, sourceStatuses: { ...snapshot.sourceStatus }, dataHealth: stockHealth(health(snapshot.marketData),health(snapshot.macroContext),health(snapshot.fundamentalData),health(snapshot.newsData)) };
}
