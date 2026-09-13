'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewInvoiceForm() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [clientNif, setClientNif] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientPostal, setClientPostal] = useState('')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [iva, setIva] = useState(21)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lastUrl, setLastUrl] = useState('')

  const handleCreate = async () => {
    if (!clientName.trim() || !concept.trim() || !amount) { setError('Cliente, concepto e importe son obligatorios'); return }
    setError('')
    setSaving(true)
    const res = await fetch('/api/invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, clientNif, clientAddress, clientPostal, concept, amount: Number(amount), iva }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setLastUrl(data.url)
    setClientName(''); setClientNif(''); setClientAddress(''); setClientPostal(''); setConcept(''); setAmount('')
    router.refresh()
  }

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
      <h2 className="text-sm font-bold mb-4">Nueva factura</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
        <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="NIF/DNI cliente (opcional)" value={clientNif} onChange={e => setClientNif(e.target.value)} />
        <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Dirección (opcional)" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
        <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Código postal (opcional)" value={clientPostal} onChange={e => setClientPostal(e.target.value)} />
        <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Concepto" value={concept} onChange={e => setConcept(e.target.value)} />
        <div className="flex gap-2">
          <input className="flex-1 bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" type="number" placeholder="Importe (base)" value={amount} onChange={e => setAmount(e.target.value)} />
          <select value={iva} onChange={e => setIva(Number(e.target.value))} className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3 py-2.5 rounded-lg text-sm outline-none">
            {[21, 10, 4, 0].map(v => <option key={v} value={v}>{v}% IVA</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-[#FF6B6B] text-xs mb-3">{error}</p>}
      {lastUrl && (
        <p className="text-xs text-[#7CD992] mb-3">
          Factura generada — <a href={lastUrl} target="_blank" className="underline">descargar PDF</a>
        </p>
      )}
      <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50">
        {saving ? 'Generando...' : '+ Generar factura'}
      </button>
    </div>
  )
}
