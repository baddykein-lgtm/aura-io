import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveMemory(userId: string, key: string, value: string) {
  await supabase.from('memories').upsert(
    { user_id: userId, key, value, updated_at: new Date() },
    { onConflict: 'user_id,key' }
  )
}

export async function getMemory(userId: string) {
  const { data } = await supabase
    .from('memories').select('key, value').eq('user_id', userId)
  return Object.fromEntries(data?.map(r => [r.key, r.value]) ?? [])
}

export async function getHistory(userId: string) {
  const { data } = await supabase
    .from('messages').select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(20)
  return (data ?? []).reverse()
}

export async function saveMessage(userId: string, role: string, content: string) {
  await supabase.from('messages').insert({ user_id: userId, role, content })
}