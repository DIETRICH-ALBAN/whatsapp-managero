const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const VERSION = 'v17.0'

export async function sendWhatsAppMessage(to: string, text: string) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        throw new Error('WhatsApp environment variables are missing')
    }

    // Nettoyage du numéro (supprimer + et espaces)
    const cleanPhone = to.replace(/[\+\s]/g, '')

    try {
        const response = await fetch(
            `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: cleanPhone,
                    type: 'text',
                    text: { preview_url: false, body: text },
                }),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error('WhatsApp API Error:', data)
            throw new Error(data.error?.message || 'Failed to send WhatsApp message')
        }

        return data
    } catch (error) {
        console.error('Send Message Failed:', error)
        throw error
    }
}
