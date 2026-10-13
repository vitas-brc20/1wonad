import axios from 'axios';
import crypto from 'crypto';

/**
 * 솔라피(Solapi / CoolSMS) HMAC-SHA256 헤더 생성
 */
function getSolapiAuthHeader(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * 전화번호 정규화 (하이픈 제거)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('010') || cleaned.startsWith('011') || cleaned.startsWith('016') || cleaned.startsWith('017') || cleaned.startsWith('018') || cleaned.startsWith('019')) {
    return cleaned;
  }
  return null;
}

/**
 * 탈환 알림 메시지 발송 함수
 * @param {Object} params
 * @param {Object} params.previousKing - 전 점령자 정보 ({ nickname, contact, amount })
 * @param {string} params.newKingNickname - 새로운 탈환자 닉네임
 * @param {number} params.nextPrice - 즉시 재탈환에 필요한 금액
 * @param {string} params.baseUrl - 사이트 URL
 */
export async function sendRevengeAlert({ previousKing, newKingNickname, nextPrice, baseUrl }) {
  if (!previousKing || !previousKing.contact) {
    console.log('[Notification] 전 점령자의 연락처가 없어 알림을 생략합니다.');
    return { success: false, reason: 'no_contact' };
  }

  const phone = cleanPhoneNumber(previousKing.contact);
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const alertText = `[1WON 전광판 👑 탈환 알림]\n` +
    `"${previousKing.nickname}"님! 방금 "${newKingNickname}"님에게 전광판을 빼앗겼습니다!\n\n` +
    `⚡ 즉시 탈환 필요 금액: ${nextPrice.toLocaleString()}원\n` +
    `지금 바로 다시 뺏으러 가기:\n${siteUrl}`;

  console.log(`\n======================================================`);
  console.log(`[Revenge Trigger] 탈환 알림 발송 시도`);
  console.log(`- 수신자: ${previousKing.nickname} (${previousKing.contact})`);
  console.log(`- 신규 점령자: ${newKingNickname}`);
  console.log(`- 탈환 필요 금액: ${nextPrice.toLocaleString()}원`);
  console.log(`======================================================\n`);

  // 1. 솔라피(Solapi / CoolSMS) 알림톡 또는 대체 문자(LMS) 발송
  const solapiApiKey = process.env.SOLAPI_API_KEY;
  const solapiApiSecret = process.env.SOLAPI_API_SECRET;
  const solapiSender = process.env.SOLAPI_SENDER_NUMBER; // 발신번호

  if (solapiApiKey && solapiApiSecret && solapiSender && phone) {
    try {
      const authHeader = getSolapiAuthHeader(solapiApiKey, solapiApiSecret);
      
      const messagePayload = {
        message: {
          to: phone,
          from: solapiSender,
          text: alertText,
          // 카카오 알림톡 템플릿 등록 시 카카오톡으로 발송 (미등록 시 일반 문자로 자동 전환 발송)
          ...(process.env.SOLAPI_PFID && process.env.SOLAPI_TEMPLATE_ID ? {
            kakaoOptions: {
              pfId: process.env.SOLAPI_PFID,
              templateId: process.env.SOLAPI_TEMPLATE_ID,
              buttons: [
                {
                  buttonType: 'WL',
                  buttonName: '즉시 복수하러 가기 ⚔️',
                  linkMo: siteUrl,
                  linkPc: siteUrl,
                }
              ]
            }
          } : {})
        }
      };

      const res = await axios.post('https://api.solapi.com/messages/v4/send', messagePayload, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      console.log('[Solapi 발송 성공]:', res.data);
      return { success: true, provider: 'solapi', data: res.data };
    } catch (err) {
      console.error('[Solapi 발송 실패]:', err.response?.data || err.message);
    }
  }

  // 2. 알리고(Aligo) 알림/문자 발송
  const aligoKey = process.env.ALIGO_API_KEY;
  const aligoUserId = process.env.ALIGO_USER_ID;
  const aligoSender = process.env.ALIGO_SENDER_NUMBER;

  if (aligoKey && aligoUserId && aligoSender && phone) {
    try {
      const formData = new URLSearchParams();
      formData.append('key', aligoKey);
      formData.append('user_id', aligoUserId);
      formData.append('sender', aligoSender);
      formData.append('receiver', phone);
      formData.append('msg', alertText);
      formData.append('title', '1WON 전광판 탈환 알림');

      const res = await axios.post('https://apis.aligo.in/send/', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000,
      });

      console.log('[Aligo 발송 성공]:', res.data);
      return { success: true, provider: 'aligo', data: res.data };
    } catch (err) {
      console.error('[Aligo 발송 실패]:', err.response?.data || err.message);
    }
  }

  // 3. API 키가 미설정된 경우 개발 모드 안내 로그
  console.warn(
    `[Notification 미발송 안내]\n` +
    `연락처(${previousKing.contact})가 입력되었으나, 알림톡/문자 발송 API 키가 .env.local에 설정되지 않았습니다.\n` +
    `발송을 활성화하려면 .env.local에 SOLAPI_API_KEY 또는 ALIGO_API_KEY를 추가해주세요.\n` +
    `미설정 시에도 서버 콘솔에 발송 대상과 메시지가 정상 기록됩니다.`
  );

  return { 
    success: false, 
    reason: 'keys_not_configured', 
    previewMessage: alertText 
  };
}
