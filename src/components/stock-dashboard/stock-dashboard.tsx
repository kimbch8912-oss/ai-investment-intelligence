'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stockAnalysisFixtures, type StockAnalysisFixture } from '../../dashboard/fixtures/stock-analysis-fixtures.ts';

const periods = ['1M', '3M', '6M', '1Y'] as const;
type Period = typeof periods[number];
const list = (items: string[]) => <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
const rows = (items: Array<[string, string]>) => <dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;

function StockChart({ fixture, period, setPeriod }: { fixture: StockAnalysisFixture; period: Period; setPeriod: (period: Period) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const el = canvas.current; if (!el) return;
      const width = el.clientWidth, height = el.clientHeight, dpr = window.devicePixelRatio || 1;
      el.width = width * dpr; el.height = height * dpr;
      const ctx = el.getContext('2d'); if (!ctx) return; ctx.scale(dpr, dpr);
      const count = { '1M': 22, '3M': 48, '6M': 72, '1Y': 100 }[period];
      const points = fixture.chart.slice(-count), values = points.flatMap((p) => [p.close, p.ma20, p.ma60, p.ma120]);
      const low = Math.min(...values) * .985, high = Math.max(...values) * 1.015;
      const y = (value: number) => 18 + (high - value) / (high - low) * (height - 66);
      const x = (index: number) => index / (points.length - 1) * (width - 2) + 1;
      ctx.strokeStyle = '#e9edf3'; ctx.lineWidth = 1;
      for (let index = 0; index < 4; index += 1) { const line = 18 + index * (height - 84) / 3; ctx.beginPath(); ctx.moveTo(0, line); ctx.lineTo(width, line); ctx.stroke(); }
      const maxVolume = Math.max(...points.map((point) => point.volume));
      points.forEach((point, index) => { const bar = point.volume / maxVolume * 32; ctx.fillStyle = '#dce6f2'; ctx.fillRect(x(index) - 2, height - 12 - bar, 4, bar); });
      ([['ma120', '#b65a8a'], ['ma60', '#519167'], ['ma20', '#d58e2e'], ['close', '#274d9a']] as const).forEach(([key, color]) => { ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(x(index), y(point[key])) : ctx.moveTo(x(index), y(point[key]))); ctx.strokeStyle = color; ctx.lineWidth = key === 'close' ? 2.4 : 1.3; ctx.stroke(); });
    };
    draw(); window.addEventListener('resize', draw); return () => window.removeEventListener('resize', draw);
  }, [fixture, period]);
  return <section className="card chart"><header><div><p>PRICE TREND</p><h2>기술적 추세</h2></div><nav>{periods.map((item) => <button className={item === period ? 'active' : ''} key={item} onClick={() => setPeriod(item)}>{item}</button>)}</nav></header><canvas ref={canvas} aria-label="Fixture 가격, 이동평균 및 거래량 차트" /><footer>━ 가격　━ MA20　━ MA60　━ MA120　▇ 거래량</footer></section>;
}

export function StockDashboard({ fixture }: { fixture: StockAnalysisFixture }) {
  const router = useRouter();
  const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const [period, setPeriod] = useState<Period>('6M');
  const filtered = stockAnalysisFixtures.filter((item) => (item.name + item.symbol).toLowerCase().includes(query.toLowerCase()));
  const view = fixture.cio.view === 'INTEREST' ? '관심' : '주의';
  return <><header className="top"><div className="search"><input value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="종목명 또는 티커 검색" aria-label="종목 검색" /><div className={`opts ${open && filtered.length ? 'show' : ''}`}>{filtered.map((item) => <button key={item.symbol} onClick={() => { router.push(`/stocks/${item.symbol}`); setQuery(''); setOpen(false); }}><b>{item.name}</b><small>{item.symbol} · {item.market}</small></button>)}</div></div></header><main className="main"><section className="asset"><div><i>개발 Fixture</i><h1>{fixture.name}</h1><p>{fixture.symbol} · {fixture.market}</p></div><div className="quote"><small>현재가 · Fixture</small><b>{fixture.currency}{fixture.price.toLocaleString()} <em className={fixture.change >= 0 ? 'up' : 'down'}>{fixture.change >= 0 ? '+' : ''}{fixture.change}%</em></b><small>분석 기준 {fixture.asOf}</small></div></section><section className="hero"><div><p>종합 투자 관점</p><h2>{view}</h2><span className="copy">{fixture.cio.summary}</span><small>신뢰도 <b>{fixture.cio.confidence}%</b></small></div><aside>핵심 판단<strong>{view}</strong><small>개발용 고정 분석 결과</small></aside></section><p className="disc">본 분석은 투자 판단을 위한 참고 정보이며, 최종 투자 결정은 사용자 판단입니다.</p><StockChart fixture={fixture} period={period} setPeriod={setPeriod} /><div className="grid"><section className="card"><p>TECHNICAL</p><h2>기술적 분석</h2>{rows(fixture.technical.summary)}<hr />{rows(fixture.technical.details)}</section><section className="card"><p>FUNDAMENTAL</p><h2>기업 기초체력</h2>{rows(fixture.fundamental)}</section><section className="card"><p>INDUSTRY</p><h2>산업 환경</h2>{rows(fixture.industry)}</section><section className="card"><p>MARKET & MACRO</p><h2>시장 · Macro 환경</h2>{rows(fixture.marketMacro)}</section></div><section className="card risk"><div><p>RISK</p><h2>위험 수준 <b>{fixture.risk.level}</b></h2></div>{list(fixture.risk.items)}</section><section className="card"><p>판단 요약</p><h2>긍정 · 부정 · 엇갈리는 신호</h2><div className="factors"><div><h3>긍정 요인</h3>{list(fixture.factors.positive)}</div><div><h3>부정 요인</h3>{list(fixture.factors.negative)}</div><div><h3>엇갈리는 신호</h3>{list(fixture.factors.conflict)}</div></div></section><div className="grid"><section className="card"><p>INVALIDATION</p><h2>이 판단을 다시 봐야 하는 조건</h2>{list(fixture.invalidation)}</section><section className="card"><p>MONITORING</p><h2>앞으로 확인할 항목</h2>{list(fixture.monitoring)}</section></div><details><summary>근거 자세히 보기</summary><div className="factors">{Object.entries(fixture.evidence).map(([name, values]) => <div key={name}><h3>{name}</h3>{list(values)}</div>)}</div></details></main></>;
}
