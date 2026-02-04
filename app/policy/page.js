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
            메시지는 결제 완료 즉시 전광판에 노출됩니다. 단, 새로운 메시지가 등록되는 즉시 기존 메시지는 다음 메시지로 교체되어 노출이 종료됩니다. 전광판에는 항상 가장 마지막에 결제 완료된 메시지만 표시됩니다. 따라서 메시지의 실제 노출 시간은 보장되지 않으며, 새로운 메시지가 등록될 때마다 즉시 교체됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">환불 규정</h2>
          <p className="text-lg leading-relaxed">
            1원 결제는 전광판 메시지 노출 서비스 참여를 위한 '티켓'의 성격을 가집니다. 메시지 등록 및 전광판 노출 서비스의 특성상 결제 완료와 동시에 서비스가 이행되므로, **원칙적으로 결제 완료 후에는 청약 철회 및 환불이 불가합니다.**

            다만, 다음의 경우에 한하여 환불을 요청하실 수 있습니다:
            *   **시스템 오류:** 결제는 정상적으로 완료되었으나, 시스템 오류로 인해 메시지가 전광판에 전혀 노출되지 않은 경우.
            *   **미등록 메시지:** 결제는 완료되었으나 기술적인 문제로 메시지 등록 처리가 지연되어 전광판에 노출되기 전에 구매자가 취소를 요청한 경우 (이 경우 즉시 고객센터로 문의).

            **환불 절차:**
            환불 사유에 해당한다고 판단될 경우, 고객센터(전화: 010-8470-9878)로 문의해 주시면 됩니다. 접수된 환불 요청은 내부 검토 후, 영업일 기준 3~5일 이내에 처리될 예정입니다. 환불 금액은 결제 수단에 따라 처리되며, 카드 결제의 경우 카드사 정책에 따라 취소 처리까지 수일이 소요될 수 있습니다.
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
