import { createServerSupabaseClient } from '../../supabase/server-client.ts';
import type { FredSeriesId } from '../providers/macro/validator.ts';

type Definition = { name: string; frequency: string; unit: string; seasonalAdjustment: string };
const definitions: Record<FredSeriesId, Definition> = {
  FEDFUNDS:{name:'Federal Funds Effective Rate',frequency:'Monthly',unit:'Percent',seasonalAdjustment:'Not Seasonally Adjusted'}, DGS2:{name:'2-Year Treasury Constant Maturity Rate',frequency:'Daily',unit:'Percent',seasonalAdjustment:'Not Seasonally Adjusted'}, DGS10:{name:'10-Year Treasury Constant Maturity Rate',frequency:'Daily',unit:'Percent',seasonalAdjustment:'Not Seasonally Adjusted'}, T10Y2Y:{name:'10-Year Treasury Minus 2-Year',frequency:'Daily',unit:'Percent',seasonalAdjustment:'Not Seasonally Adjusted'}, CPIAUCSL:{name:'Consumer Price Index: All Items',frequency:'Monthly',unit:'Index 1982-1984=100',seasonalAdjustment:'Seasonally Adjusted'}, CPILFESL:{name:'Consumer Price Index: Less Food and Energy',frequency:'Monthly',unit:'Index 1982-1984=100',seasonalAdjustment:'Seasonally Adjusted'}, PCEPI:{name:'Personal Consumption Expenditures Price Index',frequency:'Monthly',unit:'Index 2017=100',seasonalAdjustment:'Seasonally Adjusted'}, UNRATE:{name:'Unemployment Rate',frequency:'Monthly',unit:'Percent',seasonalAdjustment:'Seasonally Adjusted'}, PAYEMS:{name:'All Employees, Total Nonfarm',frequency:'Monthly',unit:'Thousands of Persons',seasonalAdjustment:'Seasonally Adjusted'}, GDP:{name:'Gross Domestic Product',frequency:'Quarterly',unit:'Billions of Dollars',seasonalAdjustment:'Seasonally Adjusted Annual Rate'}, M2SL:{name:'M2',frequency:'Monthly',unit:'Billions of Dollars',seasonalAdjustment:'Seasonally Adjusted'}, VIXCLS:{name:'CBOE Volatility Index',frequency:'Daily',unit:'Index',seasonalAdjustment:'Not Seasonally Adjusted'}, SP500:{name:'S&P 500',frequency:'Daily',unit:'Index',seasonalAdjustment:'Not Seasonally Adjusted'}, NASDAQCOM:{name:'NASDAQ Composite Index',frequency:'Daily',unit:'Index',seasonalAdjustment:'Not Seasonally Adjusted'}
};

/** Server-only registration; it never changes an existing M1 definition. */
export class FredSeriesRegistrationService {
  private readonly db = createServerSupabaseClient();
  async resolve(series: FredSeriesId): Promise<{ id: string; frequency: string } | null> {
    const source = await this.db.from('system_sources').select('id').eq('code', 'FRED').maybeSingle();
    if (source.error) throw Error(`FRED_SOURCE_READ: ${source.error.message}`);
    if (!source.data) return null;
    const existing = await this.db.from('economic_series').select('id,frequency').eq('source_id', source.data.id).eq('source_series_id', series).maybeSingle();
    if (existing.error) throw Error(`FRED_SERIES_READ: ${existing.error.message}`);
    if (existing.data) return existing.data;
    const definition = definitions[series];
    const inserted = await this.db.from('economic_series').insert({ source_id: source.data.id, source_series_id: series, name: definition.name, country: 'US', frequency: definition.frequency, unit: definition.unit, seasonal_adjustment: definition.seasonalAdjustment, description: `FRED ${series}` }).select('id,frequency').single();
    if (inserted.error) throw Error(`FRED_SERIES_REGISTER: ${inserted.error.message}`);
    return inserted.data;
  }
}
