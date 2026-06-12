import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dtlfpagrcxehmhoatpva.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZXZyY2ZscHpwbWNtbGF3dGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTEyNTk0NywiZXhwIjoyMDk2NzAxOTQ3fQ.Ooc04p1HQnq_-mkBkFJxIhjcS9Zurp0yNBYWDhUvkLU'

export const supabase = createClient(supabaseUrl, supabaseKey)

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