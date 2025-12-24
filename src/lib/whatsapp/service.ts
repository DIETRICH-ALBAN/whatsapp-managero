/**
 * VIBE Agent - WhatsApp Client Service
 * Ce service fait office de proxy vers le microservice WhatsApp sur Railway.
 */

function getServiceUrl() {
    let url = process.env.WHATSAPP_SERVICE_URL || 'https://vibevendor.up.railway.app'

    // S'assurer que l'URL commence par https://
    if (!url.startsWith('http')) {
        url = `https://${url}`
    }

    // Enlever le slash final s'il existe
    return url.replace(/\/$/, '')
}

const SERVICE_SECRET = process.env.WHATSAPP_SERVICE_SECRET || 'vibe_vendor_secure_2024'

async function callService(endpoint: string, method: string = 'GET', body?: any) {
    const baseUrl = getServiceUrl()
    const url = `${baseUrl}${endpoint}`

    console.log(`[WhatsApp] Appel service: ${method} ${url}`)

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-secret': SERVICE_SECRET
            },
            body: body ? JSON.stringify(body) : undefined,
            // Éviter les timeouts trop courts
            signal: AbortSignal.timeout(30000)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[WhatsApp] Erreur service (${response.status}):`, errorText)
            throw new Error(`Erreur service WhatsApp: ${response.status}`)
        }

        return response.json()
    } catch (error) {
        console.error('[WhatsApp] Erreur fatale lors de l\'appel au service:', error)
        throw error
    }
}

export async function startWhatsAppSession(userId: string) {
    return callService(`/connect/${userId}`, 'POST')
}

export async function getWhatsAppStatus(userId: string) {
    return callService(`/status/${userId}`)
}

export async function disconnectWhatsApp(userId: string) {
    return callService(`/disconnect/${userId}`, 'DELETE')
}

export async function sendWhatsAppMessage(userId: string, phoneNumber: string, message: string) {
    return callService(`/send/${userId}`, 'POST', { phoneNumber, message })
}
