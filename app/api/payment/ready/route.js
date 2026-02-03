import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// 서버용 Supabase 클라이언트 초기화. RLS 우회를 위해 service_role 키 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

export async function POST(req) {
  try {
    const { nickname, message } = await req.json();

    // 1. Supabase에 메시지를 'pending' 상태로 임시 저장하고, 생성된 id를 가져옵니다.
    const { data: messageData, error: insertError } = await supabase
      .from('messages')
      .insert({
        text: message,
        nickname: nickname,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error('Failed to create initial message entry.');
    }

const partner_order_id = messageData.id.toString();
    const kakaoPayReadyUrl = 'https://open-api.kakaopay.com/online/v1/payment/ready';
    
    // 개발/운영 환경에 따라 다른 키를 사용
    const secretKey = process.env.NODE_ENV === 'development'
      ? process.env.KAKAOPAY_SECRET_DEV_KEY
      : process.env.KAKAOPAY_SECRET_KEY;

    // 디버깅: Secret 키가 제대로 로드되었는지 확인
    console.log(`[${process.env.NODE_ENV} mode] Secret Key used:`, secretKey);

    const approval_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/approve`;
    const cancel_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/cancel`;
    const fail_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/fail`;

    // 2. 카카오페이 '결제 준비' API에 보낼 데이터 (JSON 형식)
    const payload = {
      cid: 'TC0ONETIME',
      partner_order_id: partner_order_id,
      partner_user_id: '1wonad-user',
      item_name: '1원 전광판 메시지',
      quantity: 1,
      total_amount: 1,
      tax_free_amount: 0,
      approval_url: approval_url,
      cancel_url: cancel_url,
      fail_url: fail_url,
    };
    
    // 3. 카카오페이 API 호출 (v1 주소 + v2 인증 + JSON 바디)
    const response = await axios.post(kakaoPayReadyUrl, payload, {
      headers: {
        'Authorization': `SECRET_KEY ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const { tid, next_redirect_pc_url } = response.data;
    
    // 4. Supabase에 tid 업데이트
    if (tid) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ tid: tid })
        .eq('id', partner_order_id);
      
      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error('Failed to update message with tid.');
      }
    } else {
      throw new Error('tid not received from KakaoPay.');
    }
    
    // 5. 클라이언트에 결제 페이지 URL 반환
    return NextResponse.json({ redirect_url: next_redirect_pc_url });

  } catch (error) {
    console.error('KakaoPay ready error:', error.response ? error.response.data : error.message);
    return NextResponse.json(
      { error: 'Payment preparation failed.', details: error.response ? error.response.data : error.message },
      { status: 500 }
    );
  }
}
