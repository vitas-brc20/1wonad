import { ImageResponse } from '@vercel/og';
import { getLatestMessage, getMessageById } from '@/app/actions';

export const runtime = 'edge';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  let displayMessage = null;
  if (id) {
    displayMessage = await getMessageById(id);
  }
  if (!displayMessage) {
    displayMessage = await getLatestMessage();
  }

  const rawText = displayMessage?.text || '아직 등록된 메시지가 없습니다. 첫 메시지를 남겨보세요!';
  
  // 7글자씩 끊어서 줄바꿈 처리 (OG 이미지는 pre-wrap을 사용하여 \n 처리)
  const formatText = (text) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += 7) {
      chunks.push(text.slice(i, i + 7));
    }
    return chunks.join('\n');
  };

  const messageText = formatText(rawText);
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
          border: '10px solid #FFD700',
          boxShadow: '0 0 30px #FFD700',
          textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700',
        }}
      >
        <div 
          style={{ 
            fontSize: 80, 
            fontWeight: 'bold', 
            marginBottom: 20, 
            display: 'flex',
            whiteSpace: 'pre-wrap', // 줄바꿈 적용
            lineHeight: 1.2
          }}
        >
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
        'Surrogate-Control': 'no-store'
      },
    },
  );
}
