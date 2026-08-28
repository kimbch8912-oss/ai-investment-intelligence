'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type StockAnalysisFixture } from '../../dashboard/fixtures/stock-analysis-fixtures.ts';
import type { StockAnalysisViewModel } from '../../lib/live-data/stock-analysis-view-model.ts';

const periods = ['1M', '3M', '6M', '1Y'] as const;

type Period = (typeof periods)[number];
type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  type: string;
};

const list = (items: string[]) => (
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const rows = (items: Array<[string, string]>) => (
  <dl>
    {items.map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
);

function StockChart({
  fixture,
  period,
  setPeriod,
}: {
  fixture: StockAnalysisFixture;
  period: Period;
  setPeriod: (period: Period) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const el = canvas.current;
      if (!el) return;

      const width = el.clientWidth;
      const height = el.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      el.width = width * dpr;
      el.height = height * dpr;

      const ctx = el.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const count = { '1M': 22, '3M': 48, '6M': 72, '1Y': 100 }[period];
      const points = fixture.chart.slice(-count);
      const values = points.flatMap((point) => [
        point.close,
        point.ma20,
        point.ma60,
        point.ma120,
      ]);
      const low = Math.min(...values) * 0.985;
      const high = Math.max(...values) * 1.015;
      const y = (value: number) =>
        18 + ((high - value) / (high - low)) * (height - 66);
      const x = (index: number) =>
        (index / (points.length - 1)) * (width - 2) + 1;

      ctx.strokeStyle = '#e9edf3';
      ctx.lineWidth = 1;
      for (let index = 0; index < 4; index += 1) {
        const line = 18 + (index * (height - 84)) / 3;
        ctx.beginPath();
        ctx.moveTo(0, line);
        ctx.lineTo(width, line);
        ctx.stroke();
      }

      const maxVolume = Math.max(...points.map((point) => point.volume));
      points.forEach((point, index) => {
        const bar = (point.volume / maxVolume) * 32;
        ctx.fillStyle = '#dce6f2';
        ctx.fillRect(x(index) - 2, height - 12 - bar, 4, bar);
      });

      (
        [
          ['ma120', '#b65a8a'],
          ['ma60', '#519167'],
          ['ma20', '#d58e2e'],
          ['close', '#274d9a'],
        ] as const
      ).forEach(([key, color]) => {
        ctx.beginPath();
        points.forEach((point, index) => {
          if (index) {
            ctx.lineTo(x(index), y(point[key]));
          } else {
            ctx.moveTo(x(index), y(point[key]));
          }
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = key === 'close' ? 2.4 : 1.3;
        ctx.stroke();
      });
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [fixture, period]);

  return (
    <section className="card chart">
      <header>
        <div>
          <p>PRICE TREND</p>
          <h2>기술적 추세</h2>
        </div>
        <nav>
          {periods.map((item) => (
            <button
              className={item === period ? 'active' : ''}
              key={item}
              onClick={() => setPeriod(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>
      <canvas ref={canvas} aria-label="Fixture 가격, 이동평균 및 거래량 차트" />
      <footer>━ 가격　━ MA20　━ MA60　━ MA120　▇ 거래량</footer>
    </section>
  );
}

export function StockDashboardV2({
  fixture,
}: {
  fixture: StockAnalysisFixture & Partial<StockAnalysisViewModel>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('6M');
  const [results, setResults] = useState<readonly SearchResult[]>([]);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(value)}`,
          { signal: controller.signal },
        );
        setResults(response.ok ? ((await response.json()) as SearchResult[]) : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const live = fixture.sourceMode === 'LIVE';
  const view =
    fixture.cio.view === 'INTEREST'
      ? '관심'
      : fixture.cio.view === 'CAUTION'
        ? '주의'
        : fixture.cio.view;

  return (
    <>
      <header className="top">
        <div className="search">
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            placeholder="종목명 또는 티커 검색"
            aria-label="종목 검색"
          />
          <div className={`opts ${open && results.length ? 'show' : ''}`}>
            {results.slice(0, 10).map((item) => (
              <button
                key={item.symbol}
                onClick={() => {
                  router.push(`/stocks/${item.symbol}`);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <b>{item.name}</b>
                <small>
                  {item.symbol} · {item.exchange}
                </small>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="main">
        <section className="asset">
          <div>
            <i>{live ? 'LIVE' : '개발 Fixture'}</i>
            <h1>{fixture.name}</h1>
            <p>
              {fixture.symbol} · {fixture.market}
              {live ? ` · ${fixture.liveSource} · ${fixture.liveFreshness}` : ''}
            </p>
          </div>
          <div className="quote">
            <small>현재가 · {live ? 'LIVE' : 'Fixture'}</small>
            <b>
              {fixture.currency}
              {fixture.price.toLocaleString()}{' '}
              <em className={fixture.change >= 0 ? 'up' : 'down'}>
                {fixture.change >= 0 ? '+' : ''}
                {fixture.change}%
              </em>
            </b>
            <small>
              {live
                ? `data as-of ${fixture.liveDataAsOfTime}`
                : `분석 기준 ${fixture.asOf}`}
            </small>
          </div>
        </section>

        {live && fixture.liveSources ? (
          <section className="card">
            <p>DATA SOURCES</p>
            <h2>LIVE 데이터 상태</h2>
            {rows(fixture.liveSources.map((item) => [item.name, item.status]))}
          </section>
        ) : null}

        {live && fixture.aiReport ? (
          <section className="card">
            <p>AI REPORT</p>
            <h2>AI 종합 리포트</h2>
            {fixture.aiReport.status === 'COMPLETED' ? (
              <>
                <p>{fixture.aiReport.oneLine}</p>
                <details>
                  <summary>상세 리포트 보기</summary>
                  {fixture.aiReport.sections
                    ? rows([...fixture.aiReport.sections])
                    : null}
                </details>
              </>
            ) : (
              <p>AI 리포트를 생성하지 못했습니다.</p>
            )}
          </section>
        ) : null}

        <section className="hero">
          <div>
            <p>종합 투자 관점</p>
            <h2>{view}</h2>
            <span className="copy">{fixture.cio.summary}</span>
            <small>
              신뢰도 <b>{fixture.cio.confidence}%</b>
            </small>
          </div>
          <aside>
            핵심 판단<strong>{view}</strong>
            <small>
              {live ? 'LIVE Market Data · 기타 소스 UNKNOWN' : '개발용 고정 분석 결과'}
            </small>
          </aside>
        </section>

        <p className="disc">
          본 분석은 투자 판단을 위한 참고 정보이며, 최종 투자 결정은 사용자 판단입니다.
        </p>
        <StockChart fixture={fixture} period={period} setPeriod={setPeriod} />

        <div className="grid">
          <section className="card">
            <p>TECHNICAL</p>
            <h2>기술적 분석</h2>
            {rows(fixture.technical.summary)}
            <hr />
            {rows(fixture.technical.details)}
          </section>
          <section className="card">
            <p>FUNDAMENTAL</p>
            <h2>기업 기초체력</h2>
            {rows(fixture.fundamental)}
          </section>
          <section className="card">
            <p>INDUSTRY</p>
            <h2>산업 환경</h2>
            {rows(fixture.industry)}
          </section>
          <section className="card">
            <p>MARKET & MACRO</p>
            <h2>시장 · Macro 환경</h2>
            {rows(fixture.marketMacro)}
          </section>
        </div>

        {live && fixture.newsArticles ? (
          <section className="card">
            <p>NEWS</p>
            <h2>최신 기사</h2>
            {fixture.newsArticles.length ? (
              <ul>
                {fixture.newsArticles.map((article) => (
                  <li key={article.url}>
                    <a href={article.url} target="_blank" rel="noreferrer">
                      {article.title}
                    </a>
                    <small>
                      {' '}
                      · {article.source} · {article.publishedAt} · {article.sentiment} ·{' '}
                      {article.importance}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>News source unavailable.</p>
            )}
          </section>
        ) : null}

        <section className="card risk">
          <div>
            <p>RISK</p>
            <h2>
              위험 수준 <b>{fixture.risk.level}</b>
            </h2>
          </div>
          {list(fixture.risk.items)}
        </section>

        <section className="card">
          <p>판단 요약</p>
          <h2>긍정 · 부정 · 엇갈리는 신호</h2>
          <div className="factors">
            <div>
              <h3>긍정 요인</h3>
              {list(fixture.factors.positive)}
            </div>
            <div>
              <h3>부정 요인</h3>
              {list(fixture.factors.negative)}
            </div>
            <div>
              <h3>엇갈리는 신호</h3>
              {list(fixture.factors.conflict)}
            </div>
          </div>
        </section>

        <div className="grid">
          <section className="card">
            <p>INVALIDATION</p>
            <h2>이 판단을 다시 봐야 하는 조건</h2>
            {list(fixture.invalidation)}
          </section>
          <section className="card">
            <p>MONITORING</p>
            <h2>앞으로 확인할 항목</h2>
            {list(fixture.monitoring)}
          </section>
        </div>

        <details>
          <summary>근거 자세히 보기</summary>
          <div className="factors">
            {Object.entries(fixture.evidence).map(([name, values]) => (
              <div key={name}>
                <h3>{name}</h3>
                {list(values)}
              </div>
            ))}
          </div>
        </details>
      </main>
    </>
  );
}
