import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { startOnboarding } from '@/lib/aura'
import { sendWhatsApp } from '@/lib/whatsapp'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? ''
    )
  } catch {
    return new Response('Webhook error', { status: 400 })
  }

  switch (event.type) {

    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      // Crear usuario en Supabase
      const { data: user } = await supabase
        .from('users').insert({
          email: s.customer_email,
          stripe_id: s.customer as string,
          status: 'trial'
        }).select().single()
      // Aura le da la bienvenida por WhatsApp
      if (user) await startOnboarding(user)
      break
    }

    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice
      await supabase.from('users')
        .update({ status: 'active' })
        .eq('stripe_id', inv.customer)
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      const { data: user } = await supabase
        .from('users').select().eq('stripe_id', inv.customer).single()
      if (user?.phone) await sendWhatsApp(
        user.phone,
        'Hola! Hubo un problema con tu pago. Actualiza tu tarjeta aquí: ' +
        (inv.hosted_invoice_url ?? '')
      )
      break
    }
  }

  return Response.json({ received: true })
}