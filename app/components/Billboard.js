'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js'; // Supabase 클라이언트 사이드용

// Supabase 클라이언트 초기화 (클라이언트 컴포넌트용)
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
      .channel('latest_message_changes') // 채널 이름은 자유롭게 지정 가능
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // UPDATE 이벤트만 구독
          schema: 'public',
          table: 'messages',
          filter: `status=eq.paid`, // status가 'paid'인 경우만 필터링
        },
        (payload) => {
          // 새로 'paid' 상태가 된 메시지를 최신 메시지로 설정
          setLatestMessage(payload.new);
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      channel.unsubscribe();
    };
  }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행됨

  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAOTALK_JS_KEY);
    }
  }, []);

  // 카카오 공유 버튼 생성
  useEffect(() => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const shareUrl = window.location.href; // 현재 페이지 URL
      const imageUrl = `${window.location.origin}/api/og?id=${latestMessage?.id || 'no_message'}&_=${Date.now()}`;
      const descriptionText = latestMessage
        ? `"${latestMessage.text}" - ${latestMessage.nickname}`
        : '1원으로 당신의 메시지를 전 세계에 보여주세요!';

      window.Kakao.Share.createDefaultButton({
        container: '#kakaotalk-sharing-btn',
        objectType: 'feed',
        content: {
          title: '1원 전광판',
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
  }, [latestMessage]); // latestMessage가 변경될 때마다 공유 내용 업데이트

  const handleSubmit = async () => {
    if (!messageInput.trim() || !nicknameInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 우리 서버의 '결제 준비' API 호출
      const response = await axios.post('/api/payment/ready', {
        message: messageInput,
        nickname: nicknameInput,
      });

      // 2. 응답으로 받은 카카오페이 결제 페이지 URL로 사용자 이동
      const { redirect_url } = response.data;
      if (redirect_url) {
        window.location.href = redirect_url;
      }
    } catch (err) {
      console.error('Payment initiation failed:', err.response ? err.response.data : err.message);
      setError('결제 시작 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans w-full">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-5xl font-bold text-yellow-300 tracking-wider">1원 전광판</h1>
        <p className="text-lg text-gray-400 mt-2">1원으로 당신의 메시지를 전 세계에 보여주세요!</p>
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
              {isSubmitting ? '처리 중...' : '1원 보내고 등록'}
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
