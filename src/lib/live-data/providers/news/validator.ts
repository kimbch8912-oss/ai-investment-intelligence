import type { NewsDocument } from '../../../agents/news/types.ts';
export class AlphaVantageNewsValidationError extends Error {}
export function publishedAt(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{8}T\d{6}$/.test(value)) throw new AlphaVantageNewsValidationError('INVALID_PUBLISHED_AT');
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`;
  if (Number.isNaN(Date.parse(iso))) throw new AlphaVantageNewsValidationError('INVALID_PUBLISHED_AT'); return iso;
}
export function deduplicate(documents: readonly NewsDocument[]): NewsDocument[] { const groups = new Map<string, number>(); return documents.map((document) => { const url = typeof document.metadata?.url === 'string' ? document.metadata.url : ''; const key = url.toLowerCase().replace(/\?.*$/, '') || document.title.toLowerCase().trim(); const number = groups.get(key) ?? 0; groups.set(key, number + 1); return number ? { ...document, duplicateGroupId: `alpha-vantage:${key}` } : document; }); }
