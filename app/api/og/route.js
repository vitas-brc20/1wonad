import { ImageResponse } from '@vercel/og';
import { getLatestMessage, getMessageById } from '@/app/actions'; // getMessageById 임포트 추가

export const runtime = 'edge'; // Edge 런타임을 사용하여 성능 최적화

export async function GET(req) {
  // URL에서 id 쿼리 파라미터 파싱
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  let displayMessage = null;

  if (id) {
    // id가 있으면 해당 id의 메시지를 가져오려 시도
    displayMessage = await getMessageById(id);
  }

  if (!displayMessage) {
    // id로 메시지를 찾지 못했거나 id가 없으면 최신 메시지 가져오기
    displayMessage = await getLatestMessage();
  }

  const messageText = displayMessage?.text || '아직 등록된 메시지가 없습니다. 첫 메시지를 남겨주세요!';
  const nicknameText = displayMessage?.nickname ? `- ${displayMessage.nickname}` : '';


  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: 'white',
          background: 'linear-gradient(to right, #000000, #333333)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 50,
          textAlign: 'center',
          fontFamily: 'sans-serif',
          border: '10px solid #FFD700', // Neon yellow border
          boxShadow: '0 0 30px #FFD700', // Neon glow effect
          textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700', // Neon text glow
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20, display: 'flex' }}>
            "{messageText}"
        </div>
        {nicknameText && (
          <div style={{ fontSize: 60, marginTop: 10, color: '#90EE90', display: 'flex' }}>
            {nicknameText}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
              headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                  'Surrogate-Control': 'no-store' // Vercel CDN 캐시를 위한 헤더
              },    },
  );
}
