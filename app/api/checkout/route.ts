import { NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-05-27.dahlia' })
}

const PRICE_IDS: Record<number, string> = {
  0: 'price_1TgkKwPRC27iGRaJrJuZaxKv',
  1: 'price_1UEeJrPRC27iGRaJM63zMdR1',
  2: 'price_1UEeKPPRC27iGRaJtESbBf8b',
  3: 'price_1UEeKpPRC27iGRaJ0cWKji71',
}

export async function POST(req: Request) {
  try {
    const { email, planIndex = 0 } = await req.json()
    const priceId = PRICE_IDS[Number(planIndex)] ?? PRICE_IDS[0]

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bienvenida?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
