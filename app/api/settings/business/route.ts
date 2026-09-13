import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

const RESERVED_SLUGS = new Set([
  'dashboard', 'login', 'api', 'bienvenida', 'reservar', 'public',
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
])

function normalizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('users')
    .select('business_slug, business_name, business_bio')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ business: data })
}

export async function PUT(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { business_slug, business_name, business_bio } = await req.json()

  let slug: string | null = null
  if (business_slug?.trim()) {
    slug = normalizeSlug(business_slug)
    if (slug.length < 3) return NextResponse.json({ error: 'El enlace debe tener al menos 3 caracteres' }, { status: 400 })
    if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ error: 'Ese enlace no está disponible' }, { status: 400 })

    const { data: taken } = await supabase
      .from('users')
      .select('id')
      .eq('business_slug', slug)
      .neq('id', user.id)
      .maybeSingle()
    if (taken) return NextResponse.json({ error: 'Ese enlace ya lo usa otro negocio' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('users')
    .update({ business_slug: slug, business_name: business_name ?? null, business_bio: business_bio ?? null })
    .eq('id', user.id)
    .select('business_slug, business_name, business_bio')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ business: data })
}
