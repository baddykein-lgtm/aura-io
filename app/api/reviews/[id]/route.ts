import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params

  await supabase.from('reviews').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
