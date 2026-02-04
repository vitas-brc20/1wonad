'use server';

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

/**
 * 결제 완료된 가장 최신 메시지 1개를 가져옵니다.
 * @returns {Promise<object|null>}
 */
export async function getLatestMessage() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, text, nickname') // id도 함께 선택
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest message:', error);
    return null;
  }

  return data;
  revalidatePath('/');
}

/**
 * 특정 ID를 가진 결제 완료된 메시지를 가져옵니다.
 * @param {string} id - 메시지 ID
 * @returns {Promise<object|null>}
 */
export async function getMessageById(id) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, text, nickname')
    .eq('id', id)
    .eq('status', 'paid')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching message by ID (${id}):`, error);
    return null;
  }

  return data;
  revalidatePath('/');
}
