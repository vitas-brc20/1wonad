/**
 * 비속어 및 유해 키워드 필터링 유틸
 */
const FORBIDDEN_WORDS = [
  '섹스', '야동', '성인', '조건만남', '출장', '토토', '카지노', '바카라', '홀덤',
  '먹튀', '사설', '대출', '사채', '시발', '씨발', '개새끼', '병신', '지랄',
  '존나', '썅', '느금', '애미', '자살', '마약', '대마', '텔레그램', '라인아이디'
];

export function filterProfanity(text) {
  if (!text) return { isValid: true, cleanText: '' };

  const normalized = text.replace(/\s+/g, '').toLowerCase();
  
  for (const word of FORBIDDEN_WORDS) {
    if (normalized.includes(word)) {
      return {
        isValid: false,
        error: `부적절하거나 제한된 단어('${word}')가 포함되어 있습니다.`
      };
    }
  }

  // URL / 링크 방지 (도박 사이트 등 유입 차단)
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|kr|me|xyz|top|vip|cc))/i;
  if (urlPattern.test(text)) {
    return {
      isValid: false,
      error: '광고 링크(URL) 및 웹사이트 도메인은 등록할 수 없습니다.'
    };
  }

  // 전화번호 패턴 방지
  const phonePattern = /(01[016789][- ]?\d{3,4}[- ]?\d{4})|(\d{2,3}[- ]?\d{3,4}[- ]?\d{4})/;
  if (phonePattern.test(text)) {
    return {
      isValid: false,
      error: '전화번호나 연락처 형태의 문구는 등록할 수 없습니다.'
    };
  }

  return { isValid: true, cleanText: text.trim() };
}
