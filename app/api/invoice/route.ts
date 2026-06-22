import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

export async function POST(req: Request) {
  const { userId, clientName, concept, amount } = await req.json()

  if (!userId || !clientName || !concept || !amount) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data: memories } = await supabase.from('memories').select('key, value').eq('user_id', userId)
  const mem = Object.fromEntries((memories ?? []).map((m: any) => [m.key, m.value]))

  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  const invoiceNumber = `FAC-${String((count ?? 0) + 1).padStart(4, '0')}`

  await supabase.from('invoices').insert({
    user_id: userId,
    client_name: clientName,
    concept,
    amount,
    invoice_number: invoiceNumber
  })

  const doc = new jsPDF()

  // Cabecera
  doc.setFontSize(22)
  doc.setTextColor(127, 119, 221)
  doc.text('FACTURA', 190, 20, { align: 'right' })

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(invoiceNumber, 190, 27, { align: 'right' })
  doc.text('Fecha: ' + new Date().toLocaleDateString('es-ES'), 190, 33, { align: 'right' })

  // Datos del emisor
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text(mem.nombre ?? 'Profesional', 20, 20)
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (mem.profesion) doc.text(mem.profesion, 20, 27)
  if (mem.ciudad) doc.text(mem.ciudad, 20, 33)

  // Línea separadora
  doc.setDrawColor(220, 220, 220)
  doc.line(20, 45, 190, 45)

  // Cliente
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('Facturado a:', 20, 55)
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(clientName, 20, 62)

  // Línea separadora
  doc.setDrawColor(220, 220, 220)
  doc.line(20, 75, 190, 75)

  // Cabecera tabla
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('CONCEPTO', 20, 83)
  doc.text('IMPORTE', 190, 83, { align: 'right' })

  // Línea
  doc.line(20, 87, 190, 87)

  // Concepto y precio
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text(concept, 20, 96)
  doc.text(`${Number(amount).toFixed(2)} €`, 190, 96, { align: 'right' })

  // Línea
  doc.setDrawColor(220, 220, 220)
  doc.line(20, 103, 190, 103)

  // Total
  doc.setFontSize(13)
  doc.setTextColor(127, 119, 221)
  doc.text(`TOTAL: ${Number(amount).toFixed(2)} €`, 190, 113, { align: 'right' })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(170, 170, 170)
  doc.text('Generado con Aura.io', 105, 280, { align: 'center' })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  const fileName = `factura-${userId}-${Date.now()}.pdf`

  const { error } = await supabase.storage
    .from('invoices')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (error) {
    console.error('Error subiendo PDF:', error)
    return NextResponse.json({ error: 'Error subiendo PDF' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName)

  return NextResponse.json({ url: publicUrl, invoiceNumber })
}