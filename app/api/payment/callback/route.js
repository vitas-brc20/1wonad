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

  // Case 1: 결제 승인 토큰(pg_token) 수신
  if (pg_token && partner_order_id) {
    try {
      // 1. DB에서 결제 대기 중인 주문 조회
      const { data: currentOrder, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', partner_order_id)
        .single();

      if (fetchError || !currentOrder) {
        console.error('Callback error: Order not found.', fetchError);
        return NextResponse.redirect(new URL('/?status=fail&msg=order_not_found', process.env.NEXT_PUBLIC_BASE_URL));
      }

      const { tid, amount: orderAmount, nickname } = currentOrder;

      // 2. 동시성 검증 (동시에 여러 결제가 승인 대기 중일 때 현재 1등 점령 금액보다 낮으면 롤백/실패 처리)
      const { data: currentKing } = await supabase
        .from('messages')
        .select('id, amount, paid_at, created_at, nickname, contact')
        .eq('status', 'paid')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentKing && currentKing.amount >= orderAmount && currentKing.id !== currentOrder.id) {
        // 이미 다른 사용자가 더 높은 금액으로 먼저 점령을 완료한 경우
        console.warn(`Race condition: Current king price (${currentKing.amount}) >= Order price (${orderAmount})`);
        return NextResponse.redirect(
          new URL(`/?status=overtaken&msg=already_overtaken`, process.env.NEXT_PUBLIC_BASE_URL)
        );
      }

      // 3. 카카오페이 결제 승인 API 호출
      const cid = process.env.KAKAOPAY_CID || 'TC0ONETIME';
      const isTestCid = cid === 'TC0ONETIME';

      let secretKey = isTestCid
        ? (process.env.KAKAOPAY_SECRET_DEV_KEY || process.env.KAKAOPAY_SECRET_KEY)
        : (process.env.KAKAOPAY_SECRET_KEY || process.env.KAKAOPAY_SECRET_DEV_KEY);

      const kakaoPayApproveUrl = 'https://open-api.kakaopay.com/online/v1/payment/approve';

      const payload = {
        cid: cid,
        tid: tid,
        partner_order_id: partner_order_id,
        partner_user_id: nickname,
        pg_token: pg_token,
      };

      try {
        await axios.post(kakaoPayApproveUrl, payload, {
          headers: {
            'Authorization': `SECRET_KEY ${secretKey}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (approveErr) {
        const altKey = secretKey === process.env.KAKAOPAY_SECRET_KEY 
          ? process.env.KAKAOPAY_SECRET_DEV_KEY 
          : process.env.KAKAOPAY_SECRET_KEY;

        if (altKey && approveErr.response?.data?.error_code === -403) {
          await axios.post(kakaoPayApproveUrl, payload, {
            headers: {
              'Authorization': `SECRET_KEY ${altKey}`,
              'Content-Type': 'application/json',
            },
          });
        } else {
          throw approveErr;
        }
      }

      const now = new Date().toISOString();

      // 4. 기존 1등 유저의 점령 종료 시간(replaced_at) 및 유지 시간(reign_seconds) 기록
      if (currentKing && currentKing.paid_at) {
        const reignSec = Math.floor((new Date(now).getTime() - new Date(currentKing.paid_at).getTime()) / 1000);
        await supabase
          .from('messages')
          .update({
            replaced_at: now,
            reign_seconds: reignSec
          })
          .eq('id', currentKing.id);

        // ※ 유저 탈환 알림 (Revenge Trigger)
        // 탈환당한 전 점령자(currentKing)에게 카카오 알림톡/웹푸시/이메일 연동 포인트
        console.log(`[Revenge Trigger] 유저 '${currentKing.nickname}'(연락처: ${currentKing.contact || '미입력'})님이 '${nickname}'님에게 전광판을 빼앗겼습니다!`);
      }

      // 5. 이번 승인된 메시지를 새 점령자(paid)로 확정
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          status: 'paid',
          paid_at: now
        })
        .eq('id', partner_order_id);

      if (updateError) {
        console.error('Callback error: DB status update failed.', updateError);
        throw new Error('Failed to update payment status.');
      }

      // 6. 캐시 갱신 및 완료 리다이렉트
      revalidatePath('/');
      return NextResponse.redirect(new URL('/?status=success', process.env.NEXT_PUBLIC_BASE_URL));

    } catch (error) {
      console.error('KakaoPay callback approve error:', error.response?.data || error.message);
      return NextResponse.redirect(new URL('/?status=fail', process.env.NEXT_PUBLIC_BASE_URL));
    }
  }

  // Case 2: 결제 취소 또는 실패
  return NextResponse.redirect(new URL('/?status=cancel', process.env.NEXT_PUBLIC_BASE_URL));
}
