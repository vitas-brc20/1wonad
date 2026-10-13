/**
 * 한국 표준시(KST, UTC+9) 기준 당일 00:00:00(자정)의 UTC ISO 문자열을 반환합니다.
 */
export function getKSTTodayStart() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const year = kstDate.getUTCFullYear();
  const month = kstDate.getUTCMonth();
  const day = kstDate.getUTCDate();

  // KST 00:00:00에 해당하는 UTC 시각 계산
  const kstMidnightUtc = new Date(Date.UTC(year, month, day) - kstOffset);
  return kstMidnightUtc.toISOString();
}

/**
 * 다음 자정(KST 00:00:00)까지 남은 초(seconds)를 계산합니다.
 */
export function getSecondsUntilNextKSTMidnight() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const year = kstDate.getUTCFullYear();
  const month = kstDate.getUTCMonth();
  const day = kstDate.getUTCDate();

  // 내일 KST 00:00:00의 UTC 시각
  const nextKstMidnightUtc = new Date(Date.UTC(year, month, day + 1) - kstOffset);
  const diffSec = Math.floor((nextKstMidnightUtc.getTime() - now.getTime()) / 1000);
  return Math.max(0, diffSec);
}
