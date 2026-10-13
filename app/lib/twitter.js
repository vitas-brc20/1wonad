import { TwitterApi } from 'twitter-api-v2';

/**
 * X(구 트위터)에 1원 전광판 실시간 탈환 속보를 게시하는 모듈
 * 
 * @param {Object} params
 * @param {string} params.newKingNickname - 신규 점령자 닉네임
 * @param {string} params.messageText - 신규 점령자가 등록한 전광판 문구
 * @param {number} params.amount - 이번 점령에 지불된 금액
 * @param {number} params.nextPrice - 다음 탈환에 필요한 최소 금액
 * @param {Object} [params.previousKing] - 이전 점령자 정보 ({ nickname, twitterHandle, contact })
 * @param {string} [params.siteUrl] - 서비스 웹사이트 URL
 */
export async function postRevengeTweet({
  newKingNickname,
  messageText,
  amount,
  nextPrice,
  previousKing,
  siteUrl,
}) {
  const url = siteUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://1wonad.com';
  
  // 이전 점령자의 X(트위터) 핸들 확인 (@ 제거 후 정규화)
  let mentionText = '';
  if (previousKing?.contact) {
    const rawContact = previousKing.contact.trim();
    if (rawContact.startsWith('@') || (!rawContact.startsWith('010') && !rawContact.includes('@'))) {
      const handle = rawContact.replace(/^@/, '');
      mentionText = `\n🔔 @${handle} 님, 전광판을 빼앗겼습니다!`;
    }
  }

  const prevNick = previousKing?.nickname ? `"${previousKing.nickname}"` : '이전 점령자';

  // 트윗 본문 (280자 제한 내로 안전하게 구성)
  const tweetText = 
`👑 [1원 전광판 탈환 속보!]

⚔️ "${newKingNickname}"님이 ${prevNick}님을 몰아내고 1위를 차지했습니다!${mentionText}

💬 새로운 전광판 문구:
"${messageText}"

💰 현재 점령가: ${Number(amount).toLocaleString()}원
⚡ 다음 탈환 금액: ${Number(nextPrice).toLocaleString()}원

👉 지금 뺏으러 가기: ${url}
#1원전광판 #전광판배틀`;

  console.log('\n======================================================');
  console.log('[X(트위터) 실시간 탈환 포스팅]');
  console.log(tweetText);
  console.log('======================================================\n');

  // 환경 변수 확인
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn(
      '[Twitter 미발송 안내] TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET 환경변수가 .env.local에 설정되지 않아 실제 API 전송은 생략되었습니다.'
    );
    return { success: false, reason: 'keys_not_configured', tweetText };
  }

  try {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    const rwClient = client.readWrite;
    const result = await rwClient.v2.tweet(tweetText);

    console.log('[X(트위터) 게시 성공]:', result.data);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[X(트위터) 게시 실패]:', error?.data || error?.message || error);
    return { success: false, error: error?.data || error?.message };
  }
}
