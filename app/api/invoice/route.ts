import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId, clientName, concept, amount } = await req.json()

  if (!userId || !clientName || !concept || !amount) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data: user } = await supabase.from('users').select().eq('id', userId).single()
  const { data: memories } = await supabase.from('memories').select('key, value').eq('user_id', userId)
  const mem = Object.fromEntries((memories ?? []).map(m => [m.key, m.value]))

  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  const invoiceNumber = `FAC-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data: invoice } = await supabase.from('invoices').insert({
    user_id: userId,
    client_name: clientName,
    concept,
    amount,
    invoice_number: invoiceNumber
  }).select().single()

  const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(20).fillColor('#7F77DD').text('FACTURA', { align: 'right' })
    doc.fontSize(10).fillColor('#666').text(invoiceNumber, { align: 'right' })
    doc.moveDown(2)

    doc.fontSize(12).fillColor('#1a1a1a').text(mem.nombre ?? 'Profesional', { continued: false })
    if (mem.profesion) doc.fontSize(10).fillColor('#666').text(mem.profesion)
    if (mem.ciudad) doc.fontSize(10).fillColor('#666').text(mem.ciudad)
    doc.moveDown(1.5)

    doc.fontSize(10).fillColor('#888').text('Fecha: ' + new Date().toLocaleDateString('es-ES'))
    doc.moveDown(1)

    doc.fontSize(11).fillColor('#1a1a1a').text('Cliente: ' + clientName)
    doc.moveDown(1.5)

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e5e5').stroke()
    doc.moveDown(0.5)

    doc.fontSize(11).fillColor('#1a1a1a').text(concept, 50, doc.y, { width: 350, continued: true })
    doc.text(`${Number(amount).toFixed(2)} €`, { align: 'right' })

    doc.moveDown(1)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e5e5').stroke()
    doc.moveDown(0.5)

    doc.fontSize(13).fillColor('#7F77DD').text(`TOTAL: ${Number(amount).toFixed(2)} €`, { align: 'right' })

    doc.moveDown(3)
    doc.fontSize(8).fillColor('#aaa').text('Generado con Aura.io', { align: 'center' })

    doc.end()
  })

  return new Response(pdfBuffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoiceNumber}.pdf"`
    }
  })
}