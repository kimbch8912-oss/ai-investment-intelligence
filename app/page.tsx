import { StockDashboardV2 } from '../src/components/stock-dashboard/stock-dashboard-v2';
import { stockAnalysisFixtures } from '../src/dashboard/fixtures/stock-analysis-fixtures';

export default function Page() {
  return <div id="app"><aside className="side"><b>Stock Intelligence</b><small>Analysis Dashboard</small><p>ANALYSIS</p><span>종목 분석</span><p>DATA STATUS</p><small>Fixture 모드</small></aside><div className="page-content"><StockDashboardV2 fixture={stockAnalysisFixtures[0]} /></div></div>;
}
