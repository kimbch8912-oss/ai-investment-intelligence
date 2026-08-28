import { userMessage } from '../../lib/live-data/data-health.ts';

const globalStatusText: Record<string, string> = { HEALTHY: '데이터 정상', PARTIAL: '일부 데이터 제한', DEGRADED: '데이터 품질 저하', UNAVAILABLE: '분석 데이터 부족' };
const sourceStatusText: Record<string, string> = { READY: '정상', PARTIAL: '일부 제한', FAILED: '불러오기 실패', UNAVAILABLE: '데이터 없음', UNKNOWN: '상태 확인 중' };
const cacheStatusText: Record<string, string> = { HIT: '저장된 최신 데이터', MISS: '새로 조회', REFRESHED: '방금 갱신', STALE_FALLBACK: '최근 저장 데이터 사용 중', EXPIRED: '데이터 갱신 필요', UNAVAILABLE: '데이터 없음', UNKNOWN: '상태 확인 중' };
const freshnessText: Record<string, string> = { FRESH: '최신', STALE: '일부 지연', EXPIRED: '오래된 데이터', UNKNOWN: '기준시점 확인 불가' };

export const dataHealthLabels = {
  global: (status: string | null | undefined) => globalStatusText[status ?? ''] ?? '상태 확인 불가',
  source: (status: string | null | undefined) => sourceStatusText[status ?? ''] ?? '상태 확인 중',
  cache: (status: string | null | undefined) => cacheStatusText[status ?? ''] ?? '상태 확인 중',
  freshness: (status: string | null | undefined) => freshnessText[status ?? ''] ?? '기준시점 확인 불가',
  error: (errorCode: string | null | undefined, errorMessage: string | null | undefined) => userMessage(errorCode ?? null) ?? (errorCode || errorMessage ? '데이터를 불러오는 중 문제가 발생했습니다.' : null),
};

export function formatDataAsOfTime(value: string | null | undefined) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '기준시점 없음';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
