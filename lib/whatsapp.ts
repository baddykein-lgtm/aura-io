import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendWhatsApp(phone: string, text: string) {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`,
      body: text
    })
    console.log(`Enviado a ${phone}`)
  } catch (err: any) {
    console.error('Error Twilio:', err)
  }
}