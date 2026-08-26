import type { Metadata } from 'next';
import { StockDashboard } from '../../../src/components/stock-dashboard/stock-dashboard';
import { stockAnalysisFixtures } from '../../../src/dashboard/fixtures/stock-analysis-fixtures';
import { loadStockLiveDashboard } from '../../../src/lib/live-data/stock-live-dashboard';
import { resolveUsEquity } from '../../../src/lib/live-data/stock-asset-resolver';
import { resolveKoreaStock } from '../../../src/lib/live-data/providers/korea/symbol-resolver';

type Props = { params: Promise<{ symbol: string }> };

function findFixture(symbol: string) {
  return stockAnalysisFixtures.find((fixture) => fixture.symbol === symbol.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const fixture = findFixture(symbol);
  return { title: fixture ? `${fixture.name} ${fixture.symbol} | 투자 분석` : `${symbol.toUpperCase()} | 투자 분석` };
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const fixture = findFixture(symbol);
  const resolved = resolveKoreaStock(symbol) ?? await resolveUsEquity(symbol);
  if (!resolved) return <div id="app"><aside className="side"><b>Stock Intelligence</b><small>Analysis Dashboard</small></aside><main className="main"><section className="card"><p>STOCK SEARCH</p><h1>분석 불가 종목</h1><p>현재 분석 가능한 데이터를 찾지 못했습니다.</p><small>미국 NASDAQ, NYSE, NYSE American의 개별 보통주만 지원합니다.</small></section></main></div>;
  const live = await loadStockLiveDashboard(resolved.asset, resolved.identifiers);
  if (live.kind === 'ready') return <div id="app"><aside className="side"><b>Stock Intelligence</b><small>Analysis Dashboard</small><p>ANALYSIS</p><span>종목 분석</span><p>DATA STATUS</p><small>LIVE · {live.snapshot.marketData.freshness.freshnessStatus}</small></aside><div className="page-content"><StockDashboard fixture={live.viewModel} /></div></div>;
  return <div id="app"><aside className="side"><b>Stock Intelligence</b><small>Analysis Dashboard</small><p>DATA STATUS</p><small>LIVE FAILED</small></aside><main className="main"><section className="card"><p>LIVE DATA</p><h1>{resolved.asset.name}</h1><h2>LIVE FAILED</h2><p>{live.errors.map((error) => error.code).join(', ') || 'Market data is unavailable.'}</p><small>Fixture로 대체하지 않았습니다.</small></section></main></div>;
}
