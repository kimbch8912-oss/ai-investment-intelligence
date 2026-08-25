import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StockDashboard } from '../../../src/components/stock-dashboard/stock-dashboard';
import { stockAnalysisFixtures } from '../../../src/dashboard/fixtures/stock-analysis-fixtures';

type Props = { params: Promise<{ symbol: string }> };

function findFixture(symbol: string) {
  return stockAnalysisFixtures.find((fixture) => fixture.symbol === symbol.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const fixture = findFixture(symbol);

  return { title: fixture ? `${fixture.name} ${fixture.symbol} | 투자 분석` : '지원하지 않는 종목 | 투자 분석' };
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const fixture = findFixture(symbol);

  if (!fixture) notFound();

  return <div id="app"><aside className="side"><b>Stock Intelligence</b><small>Analysis Dashboard</small><p>ANALYSIS</p><span>종목 분석</span><p>DATA STATUS</p><small>Fixture 모드</small></aside><div className="page-content"><StockDashboard fixture={fixture} /></div></div>;
}
