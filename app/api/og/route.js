import { ImageResponse } from '@vercel/og';
import { getLatestMessage } from '@/app/actions';

export const runtime = 'edge'; // Edge 런타임을 사용하여 성능 최적화

export async function GET() {
  const latestMessage = await getLatestMessage();

  const messageText = latestMessage?.text || '아직 등록된 메시지가 없습니다. 첫 메시지를 남겨주세요!';
  const nicknameText = latestMessage?.nickname ? `- ${latestMessage.nickname}` : '';

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
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20 }}>
          1원 전광판
        </div>
        <div style={{ fontSize: 50, color: '#90EE90' }}>
          "{messageText}"
        </div>
        {nicknameText && (
          <div style={{ fontSize: 40, marginTop: 10, color: '#90EE90' }}>
            {nicknameText}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
