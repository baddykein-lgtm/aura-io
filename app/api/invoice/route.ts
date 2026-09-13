import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

export async function POST(req: Request) {
  const { userId, clientName, clientNif, clientAddress, clientPostal, concept, amount, iva } = await req.json()

  if (!userId || !clientName || !concept || !amount) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data: memories } = await supabase.from('memories').select('key, value').eq('user_id', userId)
  const mem = Object.fromEntries((memories ?? []).map((m: any) => [m.key, m.value]))

  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  const invoiceNumber = `FAC-${String((count ?? 0) + 1).padStart(4, '0')}`

  const baseAmount = Number(amount)
  const ivaPercent = Number(iva ?? 21)
  const ivaAmount = baseAmount * (ivaPercent / 100)
  const total = baseAmount + ivaAmount

  await supabase.from('invoices').insert({
    user_id: userId,
    client_name: clientName,
    concept,
    amount: total,
    invoice_number: invoiceNumber
  })

  const doc = new jsPDF()

  // Cabecera morada
  doc.setFillColor(127, 119, 221)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text('FACTURA', 105, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.text(invoiceNumber, 105, 26, { align: 'center' })

  // Datos emisor (izquierda)
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('EMISOR', 20, 50)
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(mem.nombre ?? 'Profesional', 20, 57)
  if (mem.profesion) doc.text(mem.profesion, 20, 63)
  if (mem.nif) doc.text(`NIF/CIF: ${mem.nif}`, 20, 69)
  if (mem.direccion_fiscal) doc.text(mem.direccion_fiscal, 20, 75)
  if (mem.codigo_postal_fiscal) doc.text(mem.codigo_postal_fiscal, 20, 81)

  // Fecha (derecha arriba)
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Fecha: ' + new Date().toLocaleDateString('es-ES'), 190, 43, { align: 'right' })

  // Datos cliente (derecha)
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('CLIENTE', 120, 50)
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(clientName, 120, 57)
  if (clientNif) doc.text(`NIF/DNI: ${clientNif}`, 120, 63)
  if (clientAddress) doc.text(clientAddress, 120, 69)
  if (clientPostal) doc.text(clientPostal, 120, 75)

  // Línea separadora
  doc.setDrawColor(220, 220, 220)
  doc.line(20, 90, 190, 90)

  // Cabecera tabla
  doc.setFontSize(10)
  doc.setTextColor(127, 119, 221)
  doc.text('CONCEPTO', 20, 99)
  doc.text('BASE', 130, 99, { align: 'right' })
  doc.text('IVA', 160, 99, { align: 'right' })
  doc.text('TOTAL', 190, 99, { align: 'right' })

  doc.setDrawColor(200, 200, 200)
  doc.line(20, 102, 190, 102)

  // Fila concepto
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(concept, 20, 111, { maxWidth: 100 })
  doc.text(`${baseAmount.toFixed(2)} €`, 130, 111, { align: 'right' })
  doc.text(`${ivaPercent}%`, 160, 111, { align: 'right' })
  doc.text(`${total.toFixed(2)} €`, 190, 111, { align: 'right' })

  doc.line(20, 117, 190, 117)

  // Totales
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Base imponible:', 120, 127)
  doc.text(`${baseAmount.toFixed(2)} €`, 190, 127, { align: 'right' })
  doc.text(`IVA (${ivaPercent}%):`, 120, 135)
  doc.text(`${ivaAmount.toFixed(2)} €`, 190, 135, { align: 'right' })

  doc.setFillColor(127, 119, 221)
  doc.rect(110, 141, 80, 12, 'F')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(`TOTAL: ${total.toFixed(2)} €`, 190, 149, { align: 'right' })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(170, 170, 170)
  doc.text('Generado con Aura.io — Tu asistente personal', 105, 280, { align: 'center' })

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