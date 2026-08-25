import { renderDashboard, renderErrorPage, renderLoadingPage } from '../render.ts';
const html = renderDashboard();
for (const value of ['삼성전자', 'NVIDIA', '종목명 또는 티커 검색', '종합 투자 관점', '근거 자세히 보기', '개발 Fixture']) if (!html.includes(value)) throw new Error(`dashboard render missing: ${value}`);
if (!renderErrorPage().includes('종목 분석 Dashboard') || !renderLoadingPage().includes('종목 분석 Dashboard')) throw new Error('state rendering failed');
console.log('M5-H dashboard render QA PASS');
