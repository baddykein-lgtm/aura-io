import axios from 'axios'

const WA_URL = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_NUMBER_ID}/messages`

export async function sendWhatsApp(phone: string, text: string) {
  try {
    await axios.post(WA_URL, {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (err: any) {
    console.error('Error WA:', err?.response?.data)
  }
}