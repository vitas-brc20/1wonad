'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { filterProfanity } from '@/app/lib/moderation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrysgpyuwcpwebxpujof.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
);

import { getKSTTodayStart } from '@/app/lib/dateUtils';

const STEP_UP_PRICE = 1; // 탈환 시 기본 가산 금액 (+1원)
const MIN_INITIAL_PRICE = 1; // 매일 자정 리셋 시 시작 금액 (1원)

/**
 * 현재 전광판을 점령 중인 최신 결제 완료 메시지를 가져옵니다.
 */
export async function getLatestMessage() {
  noStore();
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, text, nickname, amount, created_at, paid_at, reign_seconds, contact')
      .eq('status', 'paid')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest message:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in getLatestMessage:', err);
    return null;
  }
}

/**
 * 오늘(KST 자정 00:00 이후) 결제 완료된 최신 메시지를 가져옵니다.
 */
export async function getTodayLatestMessage() {
  noStore();
  const todayStart = getKSTTodayStart();
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, text, nickname, amount, created_at, paid_at, reign_seconds, contact')
      .eq('status', 'paid')
      .gte('created_at', todayStart)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today latest message:', error);
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

/**
 * 다음 탈환에 필요한 최소 결제 금액을 계산합니다.
 * 매일 자정(00:00 KST)에 1원으로 자동 리셋됩니다.
 */
export async function getNextRequiredPrice() {
  noStore();
  const todayLatest = await getTodayLatestMessage();
  if (!todayLatest || !todayLatest.amount) {
    return MIN_INITIAL_PRICE; // 오늘 첫 점령은 1원
  }
  return Number(todayLatest.amount) + STEP_UP_PRICE;
}

/**
 * 명예의 전당 / 전광판 히스토리 랭킹을 가져옵니다.
 */
export async function getHallOfFame() {
  noStore();
  try {
    // 1. 최고 금액 점령자 TOP 5
    const { data: topAmounts } = await supabase
      .from('messages')
      .select('id, nickname, text, amount, paid_at, created_at')
      .eq('status', 'paid')
      .order('amount', { ascending: false })
      .limit(5);

    // 2. 최신 결제 내역 (배틀 히스토리) TOP 5
    const { data: recentBattles } = await supabase
      .from('messages')
      .select('id, nickname, text, amount, paid_at, created_at')
      .eq('status', 'paid')
      .order('id', { ascending: false })
      .limit(5);

    return {
      topAmounts: topAmounts || [],
      recentBattles: recentBattles || [],
    };
  } catch (err) {
    console.error('Error fetching hall of fame:', err);
    return { topAmounts: [], recentBattles: [] };
  }
}

/**
 * 특정 ID의 메시지를 가져옵니다.
 */
export async function getMessageById(id) {
  noStore();
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, text, nickname, amount')
      .eq('id', id)
      .eq('status', 'paid')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching message by ID (${id}):`, error);
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}
