import { NextResponse } from 'next/server';
import { searchUsEquities } from '../../../../src/lib/live-data/stock-asset-resolver.ts';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  if (query.trim().length < 1) return NextResponse.json([]);
  return NextResponse.json(await searchUsEquities(query));
}
