'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

/**
 * 결제 완료된 가장 최신 메시지 1개를 가져옵니다.
 * @returns {Promise<object|null>}
 */
export async function getLatestMessage() {
  const { data, error } = await supabase
    .from('messages')
    .select('text, nickname')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // .single()은 결과가 없을 때 에러를 발생시키므로, 이를 정상적인 null 값으로 처리합니다.
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest message:', error);
    return null;
  }

  return data;
}
