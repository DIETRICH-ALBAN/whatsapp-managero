/**
 * VIBE Agent - WhatsApp Client Service
 * Ce service fait office de proxy vers le microservice WhatsApp sur Railway.
 * Il permet à l'application Vercel de rester stateless tout en gardant une connexion WhatsApp active.
 */

const SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'https://vibevendor.up.railway.app'
const SERVICE_SECRET = process.env.WHATSAPP_SERVICE_SECRET || 'vibe_vendor_secure_2024'

async function callService(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${SERVICE_URL}${endpoint}`

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-secret': SERVICE_SECRET
        },
        body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Erreur service WhatsApp: ${response.status}`)
    }

    return response.json()
}

/**
 * Démarre une session WhatsApp pour un utilisateur (via Railway)
 */
export async function startWhatsAppSession(userId: string) {
    return callService(`/connect/${userId}`, 'POST')
}

/**
 * Récupère le statut de connexion WhatsApp (via Railway)
 */
export async function getWhatsAppStatus(userId: string) {
    return callService(`/status/${userId}`)
}

/**
 * Déconnecte WhatsApp (via Railway)
 */
export async function disconnectWhatsApp(userId: string) {
    return callService(`/disconnect/${userId}`, 'DELETE')
}

/**
 * Envoie un message WhatsApp (via Railway)
 */
export async function sendWhatsAppMessage(
    userId: string,
    phoneNumber: string,
    message: string
) {
    return callService(`/send/${userId}`, 'POST', { phoneNumber, message })
}
