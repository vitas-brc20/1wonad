import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pg_token = searchParams.get('pg_token');
  const partner_order_id = searchParams.get('partner_order_id');

  // Case 1: Payment Success (pg_token is present)
  if (pg_token && partner_order_id) {
    try {
      // 1. DB에서 tid를 가져옵니다.
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('tid')
        .eq('id', partner_order_id)
        .single();

      if (fetchError || !messageData) {
        console.error('Callback error: Could not find order.', fetchError);
        throw new Error('Order not found.');
      }
      
      const { tid } = messageData;

      // 개발/운영 환경에 따라 다른 키를 사용
      const secretKey = process.env.NODE_ENV === 'development'
        ? process.env.KAKAOPAY_SECRET_DEV_KEY
        : process.env.KAKAOPAY_SECRET_KEY;
        
      const kakaoPayApproveUrl = 'https://open-api.kakaopay.com/online/v1/payment/approve';

      // 2. 카카오페이 '결제 승인' API에 보낼 데이터 (JSON 형식)
      const payload = {
        cid: 'TC0ONETIME',
        tid: tid,
        partner_order_id: partner_order_id,
        partner_user_id: '1wonad-user',
        pg_token: pg_token,
      };
      
      // 3. 카카오페이 API 호출
      await axios.post(kakaoPayApproveUrl, payload, {
        headers: {
          'Authorization': `SECRET_KEY ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      // 4. DB의 메시지 상태를 'paid'로 업데이트
      const { error: updateError } = await supabase
        .from('messages')
        .update({ status: 'paid' })
        .eq('id', partner_order_id);

      if (updateError) {
        console.error('Callback error: DB status update failed.', updateError);
        throw new Error('Failed to update payment status.');
      }

      // 5. 홈페이지 캐시를 무효화하여 모든 사용자가 새 메시지를 볼 수 있게 합니다.
      revalidatePath('/');
      
      // 6. 결제가 완료되었으므로 홈페이지로 리다이렉트합니다.
      return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL));

    } catch (error) {
      console.error('KakaoPay callback (approve) error:', error.response ? error.response.data : error.message);
      // 실패 시 실패 페이지나 홈페이지로 리다이렉트
      return NextResponse.redirect(new URL('/?status=fail', process.env.NEXT_PUBLIC_BASE_URL));
    }
  }

  // Case 2: Payment Cancelled or Failed (pg_token is not present)
  console.log('Payment cancelled or failed.');
  // 사용자가 결제를 취소했거나 실패했으므로 홈페이지로 리다이렉트합니다.
  return NextResponse.redirect(new URL('/?status=cancel', process.env.NEXT_PUBLIC_BASE_URL));
}
