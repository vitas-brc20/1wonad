import Link from 'next/link';

export const metadata = {
  title: '서비스 이용약관 및 운영 정책 | 1WON 전광판',
};

export default function PolicyPage() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-start p-6 sm:p-12 font-sans">
      <header className="w-full max-w-3xl text-center mb-10 mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-400 tracking-tight">
          서비스 이용약관 및 운영 정책
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          1WON 전광판 서비스의 디지털 광고 상품 노출 및 콘텐츠 규제 규정입니다.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-gray-900/90 border border-gray-800 p-8 rounded-2xl shadow-xl space-y-8 text-sm sm:text-base leading-relaxed text-gray-300">
        
        {/* 제1조 사행성 및 도박 배제 규정 */}
        <section>
          <h2 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
            1. 디지털 광고 게재 상품 규정 (사행성 배제)
          </h2>
          <p>
            본 서비스는 순수 이용자 참여형 디지털 옥외광고(디지털 낙서판) 서비스입니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
            <li>본 서비스는 어떠한 경우에도 상금, 환전(Cash-out), 리워드, 현금성 대가를 지급하지 않습니다.</li>
            <li>결제된 금액은 전광판 텍스트 노출에 대한 '디지털 광고 상품 이용료'이며, 게임 머니나 배팅금이 아닙니다.</li>
          </ul>
        </section>

        {/* 제2조 서비스 제공 방식 */}
        <section>
          <h2 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
            2. 광고 노출 및 실시간 뺏기 점령 규칙
          </h2>
          <p>
            메시지는 결제 승인 즉시 전광판의 메인 영역에 노출됩니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
            <li>전광판에는 항상 가장 최근에 결제를 완료한 단 1개의 메시지만 노출됩니다.</li>
            <li>다른 이용자가 새로운 광고를 결제하여 등록하는 순간 기존 메시지의 노출은 즉시 종료됩니다.</li>
            <li>메시지의 노출 유지 시간은 보장되지 않으며, 후속 등록자에 의해 언제든 교체될 수 있음에 동의 후 결제합니다.</li>
          </ul>
        </section>

        {/* 제3조 콘텐츠 검열 및 제재 기준 */}
        <section>
          <h2 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
            3. 불법/유해 콘텐츠 검열 및 직권 삭제 기준
          </h2>
          <p>
            다음 각 호에 해당하는 문구는 사전 차단되거나, 결제 후라도 운영자에 의해 환불 없이 즉시 삭제 및 차단됩니다:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-400">
            <li>도박, 사설 베팅, 토토 등 사행성 조장 문구 및 관련 링크</li>
            <li>음란성 표현, 성인물, 성매매 알선 표현</li>
            <li>욕설, 비하, 특정 집단에 대한 혐오 표현, 명예훼손성 문구</li>
            <li>상업적 목적의 URL 링크, 웹사이트 도메인, 개인 연락처 노출</li>
            <li>기타 대한민국 관련 법령 및 미풍양속에 위배되는 내용</li>
          </ol>
        </section>

        {/* 제4조 환불 정책 */}
        <section>
          <h2 className="text-xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
            4. 환불 정책
          </h2>
          <p>
            디지털 콘텐츠 특성상 결제 승인과 동시에 전광판에 즉시 노출이 개시되므로, 전자상거래법 제17조 제2항에 따라 단순 변심에 의한 청약철회 및 환불이 불가능합니다. 단, 시스템 오류로 인한 결제 승인 실패나 중복 결제의 경우 전액 취소 처리됩니다.
          </p>
        </section>

        <section className="text-center pt-6 border-t border-gray-800">
          <Link href="/" className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl transition-all">
            ← 전광판으로 돌아가기
          </Link>
        </section>
      </main>
    </div>
  );
}
