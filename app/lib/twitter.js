import { TwitterApi } from 'twitter-api-v2';

/**
 * https://x.com/1wonad 공식 계정으로 실시간 탈환 트윗을 게시합니다.
 * 
 * @param {Object} params
 * @param {string} params.newKingNickname - 신규 점령자 닉네임
 * @param {string} params.messageText - 신규 점령자가 등록한 전광판 문구
 * @param {number} params.amount - 이번 점령에 지불된 금액
 * @param {number} params.nextPrice - 다음 탈환에 필요한 최소 금액
 * @param {Object} [params.previousKing] - 이전 점령자 정보 ({ nickname, amount })
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
  const url = siteUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://1wonad.vercel.app';
  const prevText = previousKing?.nickname ? ` (이전: "${previousKing.nickname}")` : '';

  // 트윗 본문 (280자 제한 내로 안전하게 구성)
  const tweetText = 
`👑 [1원 전광판 실시간 속보]

⚔️ "${newKingNickname}"님이 전광판을 점령했습니다!${prevText}

💬 새로운 전광판 문구:
"${messageText}"

💰 현재 점령가: ${Number(amount).toLocaleString()}원
⚡ 다음 탈환: ${Number(nextPrice).toLocaleString()}원

👉 지금 뺏으러 가기: ${url}
#1원전광판 #전광판배틀 @1wonad`;

  console.log('\n======================================================');
  console.log('[X(트위터) @1wonad 실시간 속보 발행]');
  console.log(tweetText);
  console.log('======================================================\n');

  // 환경 변수 확인
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn(
      '[Twitter 미발송 안내] TWITTER_API_KEY 등 환경변수가 설정되지 않아 실제 API 전송은 생략되었습니다. .env.local을 확인하세요.'
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

    console.log('[X(트위터) @1wonad 게시 완료]:', result.data);
    return { success: true, data: result.data };
  } catch (error) {
    // 트위터 API 일일 한도 초과 또는 인증 오류 시에도 결제에는 전혀 지장을 주지 않음
    console.error('[X(트위터) 게시 에러]:', error?.data || error?.message || error);
    return { success: false, error: error?.data || error?.message };
  }
}
