'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createMessage } from '@/app/actions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Billboard({ initialMessage }) {
  const [messageInput, setMessageInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [latestMessage, setLatestMessage] = useState(initialMessage);

  useEffect(() => {
    const channel = supabase
      .channel('latest_message_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `status=eq.paid`,
        },
        (payload) => {
          setLatestMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAOTALK_JS_KEY);
    }
  }, []);

  useEffect(() => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const shareUrl = window.location.href;
      const imageUrl = `${window.location.origin}/api/og?id=${latestMessage?.id || 'no_message'}&_=${Date.now()}`;
      const descriptionText = latestMessage
        ? `"${latestMessage.text}" - ${latestMessage.nickname}`
        : '당신의 메시지를 전 세계에 보여주세요!';

      window.Kakao.Share.createDefaultButton({
        container: '#kakaotalk-sharing-btn',
        objectType: 'feed',
        content: {
          title: '전광판',
          description: descriptionText,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '전광판 보기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    }
  }, [latestMessage]);

  const handleSubmit = async () => {
    if (!messageInput.trim() || !nicknameInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createMessage(messageInput, nicknameInput);
      
      if (result.success) {
        setMessageInput('');
        setNicknameInput('');
      } else {
        setError('메시지 등록 중 오류가 발생했습니다: ' + result.error);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setError('서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans w-full">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-5xl font-bold text-yellow-300 tracking-wider">전광판</h1>
        <p className="text-lg text-gray-400 mt-2">당신의 메시지를 전 세계에 보여주세요!</p>
      </header>

      <main className="w-full max-w-4xl mb-8 flex justify-center items-center h-48 bg-gray-900 border-2 border-yellow-400 rounded-lg p-4 shadow-lg">
        {latestMessage ? (
          <p className="text-4xl font-bold text-green-400 text-center">
            "{latestMessage.text}" - {latestMessage.nickname}
          </p>
        ) : (
          <p className="text-xl text-gray-500">아직 등록된 메시지가 없습니다. 첫 메시지를 남겨보세요!</p>
        )}
      </main>

      <footer className="w-full max-w-4xl">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 rounded-md border border-red-700 text-center">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">메시지 등록하기</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="이름 (최대 10자)"
              maxLength="10"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              className="flex-grow bg-gray-700 text-white placeholder-gray-400 border-2 border-transparent focus:border-yellow-400 focus:outline-none rounded-md px-4 py-2 transition-colors"
            />
            <input
              type="text"
              placeholder="메시지 (최대 20자)"
              maxLength="20"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-grow bg-gray-700 text-white placeholder-gray-400 border-2 border-transparent focus:border-yellow-400 focus:outline-none rounded-md px-4 py-2 transition-colors"
            />
            <button
              onClick={handleSubmit}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={!messageInput.trim() || !nicknameInput.trim() || isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '무료로 등록하기'}
            </button>
            <button
              id="kakaotalk-sharing-btn"
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-md transition-transform transform hover:scale-105"
            >
              카카오톡 공유
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
