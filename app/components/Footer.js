import Link from 'next/link';

export default function Footer() {
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || '1원 전광판 (1wonad)';
  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME || '대표자명 미입력';
  const businessNumber = process.env.NEXT_PUBLIC_BUSINESS_NUMBER || '000-00-00000';
  const mailOrderNumber = process.env.NEXT_PUBLIC_MAIL_ORDER_NUMBER || '통신판매업 신고 준비중';
  const address = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '서울특별시 강남구 테헤란로 (사업장 소재지)';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@1wonad.com';
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '02-000-0000';

  return (
    <footer className="w-full bg-gray-950 text-gray-400 text-xs py-10 px-4 mt-auto border-t border-gray-800/80">
      <div className="max-w-4xl mx-auto space-y-4 text-center sm:text-left">
        
        {/* 상단 약관 및 고객센터 링크 */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 pb-4 border-b border-gray-800 text-sm">
          <Link href="/policy" className="text-yellow-400 hover:underline font-bold">
            서비스 이용약관
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/policy#privacy" className="text-gray-300 hover:underline font-medium">
            개인정보처리방침
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/policy#refund" className="text-gray-300 hover:underline font-medium">
            취소 및 환불정책
          </Link>
          <span className="text-gray-700">|</span>
          <a href="https://x.com/1wonad" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline">
            공식 X (@1wonad)
          </a>
        </div>

        {/* 전자상거래법 필수 사업자 정보 표기 (PG사 가맹점 심사 필수 항목) */}
        <div className="space-y-1.5 text-gray-400 text-[11px] sm:text-xs leading-relaxed">
          <p className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1">
            <span><strong>상호:</strong> {companyName}</span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span><strong>대표자:</strong> {ownerName}</span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span><strong>사업자등록번호:</strong> {businessNumber}</span>
          </p>
          <p className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1">
            <span><strong>통신판매업신고:</strong> {mailOrderNumber}</span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span><strong>사업장 소재지:</strong> {address}</span>
          </p>
          <p className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1">
            <span><strong>고객센터:</strong> {contactPhone}</span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span><strong>이메일:</strong> {contactEmail}</span>
            <span className="text-gray-700 hidden sm:inline">|</span>
            <span><strong>호스팅 서비스:</strong> Vercel Inc.</span>
          </p>
        </div>

        {/* 결제 및 법적 고지 */}
        <div className="pt-2 text-[10px] text-gray-500 leading-normal border-t border-gray-900">
          <p>
            ※ 1원 전광판은 순수 디지털 콘텐츠(광고판 문구 노출) 서비스이며, 사행성 행위 및 환전(Cash-out) 기능을 일체 제공하지 않습니다.
          </p>
          <p className="mt-1">
            © 2026 {companyName}. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
