import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { filterProfanity } from '@/app/lib/moderation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

const STEP_UP_PRICE = 500;
const MIN_INITIAL_PRICE = 1000;

export async function POST(req) {
  try {
    const { nickname, message, contact, clientExpectedPrice } = await req.json();

    // 1. 유효성 검사 및 비속어/도박 필터링
    if (!nickname?.trim() || !message?.trim()) {
      return NextResponse.json({ error: '닉네임과 메시지를 모두 입력해주세요.' }, { status: 400 });
    }

    const nicknameCheck = filterProfanity(nickname);
    if (!nicknameCheck.isValid) {
      return NextResponse.json({ error: nicknameCheck.error }, { status: 400 });
    }

    const messageCheck = filterProfanity(message);
    if (!messageCheck.isValid) {
      return NextResponse.json({ error: messageCheck.error }, { status: 400 });
    }

    // 2. 현재 전광판의 최신 금액 확인 및 탈환 금액(targetAmount) 계산
    const { data: latestMessage } = await supabase
      .from('messages')
      .select('amount')
      .eq('status', 'paid')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentPrice = latestMessage?.amount ? Number(latestMessage.amount) : 0;
    const requiredPrice = currentPrice > 0 ? currentPrice + STEP_UP_PRICE : MIN_INITIAL_PRICE;

    // 클라이언트가 보낸 예상 가격이 이미 과거의 가격인 경우 (레이스 컨디션 방어 1단계)
    if (clientExpectedPrice && Number(clientExpectedPrice) < requiredPrice) {
      return NextResponse.json({
        error: `다른 유저가 먼저 점령하여 탈환 금액이 ${requiredPrice.toLocaleString()}원으로 인상되었습니다! 화면을 새로고침해주세요.`,
        requiredPrice
      }, { status: 409 });
    }

    // 3. Supabase에 메시지를 'pending' 상태로 생성
    const { data: messageData, error: insertError } = await supabase
      .from('messages')
      .insert({
        text: messageCheck.cleanText,
        nickname: nicknameCheck.cleanText,
        contact: contact ? contact.trim() : null,
        amount: requiredPrice,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 });
    }

    const partner_order_id = messageData.id.toString();
    const kakaoPayReadyUrl = 'https://open-api.kakaopay.com/online/v1/payment/ready';

    // 카카오페이 Secret 키 결정: 테스트 CID(TC0ONETIME)는 DEV 키를 사용해야 -403(접근 금지됨)이 발생하지 않습니다.
    const cid = process.env.KAKAOPAY_CID || 'TC0ONETIME';
    const isTestCid = cid === 'TC0ONETIME';

    let secretKey = isTestCid
      ? (process.env.KAKAOPAY_SECRET_DEV_KEY || process.env.KAKAOPAY_SECRET_KEY)
      : (process.env.KAKAOPAY_SECRET_KEY || process.env.KAKAOPAY_SECRET_DEV_KEY);

    if (!secretKey) {
      return NextResponse.json({ error: '카카오페이 Secret Key가 설정되지 않았습니다. .env.local을 확인하세요.' }, { status: 500 });
    }

    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback?partner_order_id=${partner_order_id}`;

    // 4. 카카오페이 결제 준비 요청 데이터 구성
    const payload = {
      cid: cid,
      partner_order_id: partner_order_id,
      partner_user_id: nicknameCheck.cleanText,
      item_name: `킹오브더힐 전광판 점령권 (${requiredPrice.toLocaleString()}원)`,
      quantity: 1,
      total_amount: requiredPrice,
      tax_free_amount: 0,
      approval_url: callback_url,
      cancel_url: callback_url,
      fail_url: callback_url,
    };

    let response;
    try {
      response = await axios.post(kakaoPayReadyUrl, payload, {
        headers: {
          'Authorization': `SECRET_KEY ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (apiErr) {
      // 만약 -403(권한 오류)이 발생했고 다른 키가 존재한다면 한 번 더 폴백 시도
      const altKey = secretKey === process.env.KAKAOPAY_SECRET_KEY 
        ? process.env.KAKAOPAY_SECRET_DEV_KEY 
        : process.env.KAKAOPAY_SECRET_KEY;

      if (altKey && apiErr.response?.data?.error_code === -403) {
        console.warn('KakaoPay 403 error encountered, retrying with alternative secret key...');
        response = await axios.post(kakaoPayReadyUrl, payload, {
          headers: {
            'Authorization': `SECRET_KEY ${altKey}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        throw apiErr;
      }
    }

    const { tid, next_redirect_pc_url, next_redirect_mobile_url, next_redirect_app_url } = response.data;

    // 5. tid 저장
    if (tid) {
      await supabase
        .from('messages')
        .update({ tid: tid })
        .eq('id', partner_order_id);
    }

    return NextResponse.json({
      redirect_url: next_redirect_pc_url,
      mobile_url: next_redirect_mobile_url,
      app_url: next_redirect_app_url,
      amount: requiredPrice
    });

  } catch (error) {
    console.error('KakaoPay ready error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: '결제 준비 중 오류가 발생했습니다.', details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
