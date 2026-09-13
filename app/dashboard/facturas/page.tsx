import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import NewInvoiceForm from './NewInvoiceForm'

export default async function FacturasPage() {
  const user = await requireUser()
  if (!user) redirect('/login')
  const { data: invoices } = await supabase
    .from('invoices')
    .select()
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const total = (invoices ?? []).reduce((sum, i: any) => sum + Number(i.amount ?? 0), 0)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Facturas</h1>
      <p className="text-[#8887AA] text-sm mb-6">{invoices?.length ?? 0} facturas · {total.toFixed(2)} € facturados</p>

      <NewInvoiceForm />

      {!invoices?.length ? (
        <p className="text-sm text-[#555570]">No tienes facturas todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{inv.invoice_number} · {inv.client_name}</div>
                <div className="text-xs text-[#8887AA] mt-0.5">{inv.concept} · {Number(inv.amount).toFixed(2)} €</div>
              </div>
              {inv.pdf_url && (
                <a href={inv.pdf_url} target="_blank" className="text-xs text-[#A89EFF] hover:underline shrink-0">Descargar PDF</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
