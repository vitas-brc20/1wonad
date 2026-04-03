// app/policy/page.js
import Link from 'next/link';

export default function PolicyPage() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-start p-8 font-sans">
      <header className="w-full max-w-4xl text-center mb-8 mt-12">
        <h1 className="text-4xl font-bold text-yellow-300 tracking-wider">서비스 이용약관</h1>
      </header>

      <main className="w-full max-w-4xl bg-gray-900 p-8 rounded-lg shadow-md space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">서비스 제공 방식</h2>
          <p className="text-lg leading-relaxed">
            메시지는 등록 즉시 전광판에 노출됩니다. 단, 새로운 메시지가 등록되는 즉시 기존 메시지는 다음 메시지로 교체되어 노출이 종료됩니다.
            <br/>
            전광판에는 항상 가장 마지막에 등록된 메시지만 표시됩니다. 따라서 메시지의 실제 노출 시간은 보장되지 않으며, 새로운 메시지가 등록될 때마다 즉시 교체됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">이용 안내</h2>
          <p className="text-lg leading-relaxed">
            본 서비스는 무료로 제공됩니다. 부적절한 내용(비속어, 비방, 광고 등)이 포함된 메시지는 관리자에 의해 예고 없이 삭제될 수 있으며, 서비스 이용이 제한될 수 있습니다.
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
