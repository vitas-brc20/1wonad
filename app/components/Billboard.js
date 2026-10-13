'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrysgpyuwcpwebxpujof.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Billboard({ initialMessage, initialRequiredPrice, hallOfFame }) {
  const [latestMessage, setLatestMessage] = useState(initialMessage);
  const [requiredPrice, setRequiredPrice] = useState(initialRequiredPrice || 1000);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 폼 입력 상태
  const [messageInput, setMessageInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // URL 쿼리 파라미터 (결제 성공/실패/취소/탈환당함 안내)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      if (status === 'success') {
        setToastMessage('🎉 전광판 점령에 성공했습니다! 현재 1위입니다!');
        window.history.replaceState({}, '', '/');
      } else if (status === 'overtaken') {
        setErrorMessage('⚠️ 결제 도중 다른 유저가 더 높은 금액으로 먼저 탈환하여 승인이 취소되었습니다.');
        window.history.replaceState({}, '', '/');
      } else if (status === 'cancel') {
        setErrorMessage('결제가 취소되었습니다.');
        window.history.replaceState({}, '', '/');
      } else if (status === 'fail') {
        setErrorMessage('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  // Supabase 실시간 수신 (신규 결제 완료 시 즉시 화면 갱신)
  useEffect(() => {
    const channel = supabase
      .channel('koth_message_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `status=eq.paid`,
        },
        (payload) => {
          if (payload.new) {
            setLatestMessage(payload.new);
            const newAmount = Number(payload.new.amount || 1000);
            setRequiredPrice(newAmount + 1);
            setToastMessage(`⚡ "${payload.new.nickname}"님이 ${newAmount.toLocaleString()}원으로 전광판을 점령했습니다!`);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // 점령 유지 시간 타이머 (1초마다 경과)
  useEffect(() => {
    const calcElapsed = () => {
      const targetTime = latestMessage?.paid_at || latestMessage?.created_at;
      if (!targetTime) {
        setElapsedSeconds(0);
        return;
      }
      const startTime = new Date(targetTime).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };

    calcElapsed();
    const timer = setInterval(calcElapsed, 1000);
    return () => clearInterval(timer);
  }, [latestMessage]);

  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      const jsKey = process.env.NEXT_PUBLIC_KAKAOTALK_JS_KEY;
      if (jsKey) {
        window.Kakao.init(jsKey);
      }
    }
  }, []);

  // 카카오톡 공유
  const handleShare = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      const shareUrl = window.location.href;
      const imageUrl = `${window.location.origin}/api/og?id=${latestMessage?.id || 'no_message'}&_=${Date.now()}`;
      const descriptionText = latestMessage
        ? `[현재 1위: ${latestMessage.nickname}] "${latestMessage.text}" (${Number(latestMessage.amount).toLocaleString()}원)`
        : '지금 1,000원으로 전광판을 점령해보세요!';

      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '🔥 1원 전광판: 실시간 뺏기 배틀',
          description: descriptionText,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '탈환하러 가기 ⚔️',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      alert('카카오톡 공유가 준비되지 않았습니다.');
    }
  };

  // 결제 진행 (카카오페이 결제창 호출)
  const handlePayment = async () => {
    if (!messageInput.trim() || !nicknameInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nicknameInput,
          message: messageInput,
          clientExpectedPrice: requiredPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiredPrice) {
          setRequiredPrice(data.requiredPrice);
        }
        setErrorMessage(data.error || '결제 준비 실패');
        setIsSubmitting(false);
        return;
      }

      // 모바일 / PC 분기 리다이렉트
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const targetUrl = isMobile && data.mobile_url ? data.mobile_url : data.redirect_url;

      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        setErrorMessage('결제 페이지 주소를 가져오지 못했습니다.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('서버와 통신 중 문제가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // 초 단위를 시:분:초 포맷으로 변환
  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours > 0 ? `${hours}시간 ` : ''}${minutes}분 ${seconds}초`;
  };

  // 메시지 글자 분할
  const formatBillboardText = (text) => {
    if (!text) return '';
    const chunks = [];
    for (let i = 0; i < text.length; i += 8) {
      chunks.push(text.slice(i, i + 8));
    }
    return chunks.map((chunk, index) => (
      <span key={index} className="block tracking-tight">
        {chunk}
      </span>
    ));
  };

  return (
    <div className="bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white min-h-screen flex flex-col items-center justify-start p-4 font-sans selection:bg-yellow-400 selection:text-black">
      
      {/* 알림 토스트 */}
      {toastMessage && (
        <div className="fixed top-4 z-50 animate-bounce bg-yellow-400 text-black font-extrabold px-6 py-3 rounded-full shadow-2xl border-2 border-yellow-200 text-sm sm:text-base">
          {toastMessage}
        </div>
      )}

      {/* 헤더 */}
      <header className="w-full max-w-4xl text-center my-6">
        <div className="inline-block bg-red-600/20 border border-red-500/50 text-red-400 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-widest mb-3 animate-pulse">
          ⚡ 실시간 뺏기 배틀
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 tracking-tight">
          1원 전광판 👑
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-2">
          단 1초라도 더 전광판을 점령하세요. 뺏고 뺏기는 실시간 1원 전광판!
        </p>
      </header>

      {/* 메인 킹 오브 더 힐 전광판 디스플레이 */}
      <main className="w-full max-w-4xl mb-6 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-red-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-1000"></div>
        <div className="relative w-full bg-black/90 border-2 border-yellow-400/80 rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center min-h-[320px]">
          
          {/* 상단 점령 현황 뱃지 */}
          <div className="w-full flex flex-wrap justify-between items-center gap-2 border-b border-gray-800 pb-4 mb-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-yellow-400 font-bold">현재 점령자:</span>
              <span className="text-white font-black bg-gray-800 px-2.5 py-1 rounded-md">
                {latestMessage?.nickname || '무혈입성 대기중'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <div>
                점령가: <span className="text-yellow-400 font-bold">{(latestMessage?.amount || 0).toLocaleString()}원</span>
              </div>
              <div className="bg-yellow-950/60 text-yellow-300 border border-yellow-700/50 px-2 py-0.5 rounded font-mono">
                ⏱ {formatTime(elapsedSeconds)} 점령 중
              </div>
            </div>
          </div>

          {/* 중앙 전광판 문구 */}
          {latestMessage ? (
            <div className="text-3xl sm:text-5xl font-black text-green-400 text-center leading-tight tracking-wide drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] my-auto py-4">
              "{formatBillboardText(latestMessage.text)}"
            </div>
          ) : (
            <div className="text-center my-auto py-8">
              <p className="text-2xl text-gray-500 font-bold mb-2">현재 전광판이 비어 있습니다!</p>
              <p className="text-sm text-yellow-500">첫 번째로 전광판을 점령하고 깃발을 꽂으세요!</p>
            </div>
          )}

          {/* 하단 점령 규칙 안내 */}
          <div className="w-full mt-6 pt-4 border-t border-gray-900 flex justify-between items-center text-xs text-gray-400">
            <span>⚔️ 탈환 규칙: 현재 점령가 + 1원</span>
            <span className="text-red-400 font-semibold animate-pulse">실시간 동기화 ON</span>
          </div>
        </div>
      </main>

      {/* 결제 및 탈환 인터페이스 */}
      <section className="w-full max-w-4xl mb-8">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-950/80 rounded-xl border border-red-700 text-center text-red-200 text-sm font-medium animate-shake">
            {errorMessage}
          </div>
        )}

        <div className="bg-gray-900/90 border border-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-800 gap-2">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                ⚔️ 지금 전광판 탈환하기
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                카카오페이로 1초 만에 결제하고 전광판을 내 것으로 만드세요.
              </p>
            </div>
            <div className="bg-yellow-400/10 border border-yellow-400/40 px-4 py-2 rounded-xl text-right">
              <span className="text-xs text-gray-400 block">탈환 필요 금액</span>
              <span className="text-2xl font-black text-yellow-400">
                {requiredPrice.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-300 mb-1 block">점령자 닉네임 (최대 10자)</label>
            <input
              type="text"
              placeholder="예: 강남호랑이"
              maxLength={10}
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:border-yellow-400 focus:outline-none rounded-xl px-4 py-3 text-sm transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-300 mb-1 block">전광판 문구 (최대 30자)</label>
            <input
              type="text"
              placeholder="예: 오늘은 나의 날이다! 라이벌 팬덤 모두 보고 있나?"
              maxLength={30}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:border-yellow-400 focus:outline-none rounded-xl px-4 py-3 text-sm transition-colors font-medium"
            />
            <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1 px-1">
              <span>* 음란/욕설/불법도박/도메인 광고 문구는 사전 차단 및 직권 삭제됩니다.</span>
              <span>{messageInput.length}/30자</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePayment}
              disabled={!messageInput.trim() || !nicknameInput.trim() || isSubmitting}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold py-4 px-6 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              {isSubmitting ? (
                <span>결제창 여는 중...</span>
              ) : (
                <>
                  <span>카카오페이로 {requiredPrice.toLocaleString()}원 결제하고 점령</span>
                  <span className="text-xl">🚀</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-400/40 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>카톡 도발 공유</span>
              <span>💬</span>
            </button>
          </div>
        </div>
      </section>

      {/* 명예의 전당 / 실시간 배틀 랭킹 */}
      <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        
        {/* 최고 점령가 랭킹 */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-yellow-400 mb-3 flex items-center gap-2">
            🏆 최고가 점령 명예의 전당
          </h3>
          <div className="space-y-2">
            {hallOfFame?.topAmounts?.length > 0 ? (
              hallOfFame.topAmounts.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-gray-800/60">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 text-center font-extrabold ${idx === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white truncate max-w-[120px]">{item.nickname}</span>
                    <span className="text-gray-400 truncate text-[11px]">"{item.text}"</span>
                  </div>
                  <span className="font-mono text-yellow-400 font-bold ml-2">
                    {Number(item.amount).toLocaleString()}원
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">아직 기록이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 최근 배틀 히스토리 */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-red-400 mb-3 flex items-center gap-2">
            ⚔️ 최근 탈환 배틀 기록
          </h3>
          <div className="space-y-2">
            {hallOfFame?.recentBattles?.length > 0 ? (
              hallOfFame.recentBattles.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-gray-800/60">
                  <div className="truncate">
                    <span className="font-semibold text-white">{item.nickname}</span>
                    <span className="text-gray-400 ml-2 truncate text-[11px]">"{item.text}"</span>
                  </div>
                  <span className="font-mono text-gray-300 font-medium ml-2">
                    {Number(item.amount).toLocaleString()}원
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">아직 배틀 기록이 없습니다.</p>
            )}
          </div>
        </div>

      </section>

    </div>
  );
}
