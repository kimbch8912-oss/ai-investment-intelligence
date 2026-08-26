import { NextResponse } from 'next/server';
import { searchUsEquities } from '../../../../src/lib/live-data/stock-asset-resolver.ts';
import { searchKoreaStocks } from '../../../../src/lib/live-data/providers/korea/symbol-resolver.ts';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  if (query.trim().length < 1) return NextResponse.json([]);
  const korea = searchKoreaStocks(query).map((item) => ({ ...item, exchange: item.market, type: 'Common Stock' }));
  const us = await searchUsEquities(query);
  return NextResponse.json([...korea, ...us].slice(0, 10));
}
