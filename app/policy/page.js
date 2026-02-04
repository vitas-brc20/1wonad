// app/policy/page.js
import Link from 'next/link';

export default function PolicyPage() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-start p-8 font-sans">
      <header className="w-full max-w-4xl text-center mb-8 mt-12">
        <h1 className="text-4xl font-bold text-yellow-300 tracking-wider">서비스 이용약관 및 환불 규정</h1>
      </header>

      <main className="w-full max-w-4xl bg-gray-900 p-8 rounded-lg shadow-md space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">서비스 제공 기간</h2>
          <p className="text-lg leading-relaxed">
            메시지는 결제 완료 시점부터 최대 1일 동안 전광판에 노출됩니다.
            단, 전광판은 실시간으로 새로운 메시지가 등록될 경우 기존 메시지가 밀려나는 방식이므로,
            등록되는 메시지 수에 따라 실제 노출 기간은 1일보다 짧아질 수 있습니다.
            가장 최근에 등록된 메시지만 전광판에 표시됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">환불 규정</h2>
          <p className="text-lg leading-relaxed">
            1원 결제는 전광판 메시지 노출 서비스 참여를 위한 '티켓'의 성격을 가집니다.
            결제 완료 및 메시지 등록 처리 후에는 원칙적으로 환불이 불가합니다.
            다만, **시스템 오류로 인해 정당한 가격 지불에 대한 서비스 제공(메시지 등록 및 노출)이
            어려워진 경우에 한하여 환불이 가능합니다.**
            환불 문의는 전화 (010-8470-9878)로 문의해 주시기 바랍니다.
          </p>
        </section>

        <section className="text-center mt-12">
          <Link href="/" className="text-yellow-400 hover:underline text-xl font-medium">
            &larr; 전광판으로 돌아가기
          </Link>
        </section>
      </main>
    </div>
  );
}
