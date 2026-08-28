import { dataHealthLabels, formatDataAsOfTime } from '../data-health-ui.ts';

const globalCases = [
  ['HEALTHY', '데이터 정상'],
  ['PARTIAL', '일부 데이터 제한'],
  ['DEGRADED', '데이터 품질 저하'],
  ['UNAVAILABLE', '분석 데이터 부족'],
] as const;

for (const [status, expected] of globalCases) {
  if (dataHealthLabels.global(status) !== expected) throw new Error(`global status failed: ${status}`);
}
if (dataHealthLabels.global('unexpected') !== '상태 확인 불가') throw new Error('unknown global status failed');
if (dataHealthLabels.source('FAILED') !== '불러오기 실패') throw new Error('source status failed');
if (dataHealthLabels.cache('STALE_FALLBACK') !== '최근 저장 데이터 사용 중') throw new Error('cache status failed');
if (dataHealthLabels.freshness('EXPIRED') !== '오래된 데이터') throw new Error('freshness failed');
if (dataHealthLabels.error('INTERNAL_ERROR', 'technical provider detail') !== '데이터를 불러오는 중 문제가 발생했습니다.') throw new Error('unknown error fallback failed');
for (const [code, expected] of [['PROVIDER_QUOTA', '현재 데이터 제공 한도에 도달했습니다.'], ['PROVIDER_RATE_LIMIT', '잠시 후 다시 시도해 주세요.'], ['PROVIDER_NETWORK_ERROR', '데이터 제공처 연결이 원활하지 않습니다.'], ['PROVIDER_AUTH_ERROR', '현재 데이터를 제공할 수 없습니다.']] as const) {
  if (dataHealthLabels.error(code, null) !== expected) throw new Error(`error mapper failed: ${code}`);
}
if (formatDataAsOfTime('invalid-date') !== '기준시점 없음') throw new Error('invalid date failed');
console.log('Dashboard V2 DataHealth UI QA PASS: HEALTHY/PARTIAL/DEGRADED/UNAVAILABLE/unknown/error/date');
