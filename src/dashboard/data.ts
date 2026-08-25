export interface DashboardStats { sources: number; assets: number; economicSeries: number; marketPrices: number; economicObservations: number }
export interface DashboardAsset { symbol: string | null; name: string; asset_type: string; country: string | null; exchange: string | null }
export interface DashboardEconomicSeries { name: string; source_series_id: string; frequency: string; unit: string | null; country: string | null }
export interface DashboardData { stats: DashboardStats; assets: DashboardAsset[]; economicSeries: DashboardEconomicSeries[] }

type ServerFetch = (input: string, init?: RequestInit) => Promise<Response>;
const tableNames = { sources: 'system_sources', assets: 'assets', economicSeries: 'economic_series', marketPrices: 'market_prices', economicObservations: 'economic_observations' } as const;

function serverConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Dashboard server configuration is unavailable');
  return { url: `${url.replace(/\/$/, '')}/rest/v1`, key };
}

function headers(key: string, prefer?: string) { return { apikey: key, Authorization: `Bearer ${key}`, ...(prefer ? { Prefer: prefer } : {}) }; }

async function countTable(baseUrl: string, key: string, table: string, fetcher: ServerFetch): Promise<number> {
  const response = await fetcher(`${baseUrl}/${table}?select=*`, { method: 'HEAD', headers: headers(key, 'count=exact') });
  if (!response.ok) throw new Error('Dashboard data query failed');
  const range = response.headers.get('content-range');
  const count = range?.split('/')[1];
  if (!count || !/^\d+$/.test(count)) throw new Error('Dashboard count is unavailable');
  return Number(count);
}

async function selectRows<T>(baseUrl: string, key: string, path: string, fetcher: ServerFetch): Promise<T[]> {
  const response = await fetcher(`${baseUrl}/${path}`, { headers: headers(key) });
  if (!response.ok) throw new Error('Dashboard data query failed');
  return response.json() as Promise<T[]>;
}

export async function getDashboardData(fetcher: ServerFetch = fetch): Promise<DashboardData> {
  const { url, key } = serverConfig();
  const [sources, assets, economicSeries, marketPrices, economicObservations, assetRows, seriesRows] = await Promise.all([
    countTable(url, key, tableNames.sources, fetcher), countTable(url, key, tableNames.assets, fetcher), countTable(url, key, tableNames.economicSeries, fetcher), countTable(url, key, tableNames.marketPrices, fetcher), countTable(url, key, tableNames.economicObservations, fetcher),
    selectRows<DashboardAsset>(url, key, 'assets?select=symbol,name,asset_type,country,exchange&order=symbol.asc', fetcher),
    selectRows<DashboardEconomicSeries>(url, key, 'economic_series?select=name,source_series_id,frequency,unit,country&order=source_series_id.asc', fetcher),
  ]);
  return { stats: { sources, assets, economicSeries, marketPrices, economicObservations }, assets: assetRows, economicSeries: seriesRows };
}
