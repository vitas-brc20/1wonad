import { NextResponse } from 'next/server';

export async function GET(req) {
  console.log('Payment cancelled.');
  // 사용자가 결제를 취소했으므로 홈페이지로 리다이렉트합니다.
  // DB에 'pending' 상태로 저장된 메시지는 그대로 남지만, 어차피 'paid'가 아니므로 전광판에 노출되지 않습니다.
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL));
}
