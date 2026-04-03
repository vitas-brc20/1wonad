'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

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
 */
export async function getLatestMessage() {
  noStore();
  const { data, error } = await supabase
    .from('messages')
    .select('id, text, nickname')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest message:', error);
    return null;
  }

  return data;
}

/**
 * 특정 ID를 가진 결제 완료된 메시지를 가져옵니다.
 */
export async function getMessageById(id) {
  noStore();
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
}

/**
 * 새로운 메시지를 등록합니다. (무료 버전)
 */
export async function createMessage(text, nickname) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      text: text,
      nickname: nickname,
      status: 'paid'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, data };
}
