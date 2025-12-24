import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import * as QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase-admin'
import pino from 'pino'

// Store pour garder les connexions en mémoire (pour le runtime actuel)
const activeSockets: Map<string, WASocket> = new Map()
const qrCodes: Map<string, string> = new Map()
const connectionStatus: Map<string, 'disconnected' | 'connecting' | 'connected'> = new Map()

const logger = pino({ level: 'silent' }) // Silencieux pour éviter le spam

/**
 * Démarre une session WhatsApp pour un utilisateur
 */
export async function startWhatsAppSession(userId: string): Promise<{
    qrCode?: string
    status: 'connecting' | 'connected' | 'error'
    phoneNumber?: string
    message?: string
}> {
    try {
        // Vérifier si déjà connecté
        const existingSocket = activeSockets.get(userId)
        if (existingSocket?.user) {
            return {
                status: 'connected',
                phoneNumber: existingSocket.user.id.split(':')[0]
            }
        }

        // Si un QR code existe déjà pour cet utilisateur, le retourner
        const existingQR = qrCodes.get(userId)
        if (existingQR && connectionStatus.get(userId) === 'connecting') {
            return {
                status: 'connecting',
                qrCode: existingQR
            }
        }

        connectionStatus.set(userId, 'connecting')

        // Récupérer les credentials depuis Supabase
        const { data: sessionData } = await supabaseAdmin
            .from('whatsapp_sessions')
            .select('id, creds')
            .eq('user_id', userId)
            .single()

        let authState: any

        if (sessionData?.creds) {
            // Restaurer les credentials existants
            const creds = JSON.parse(sessionData.creds)
            authState = {
                creds,
                keys: {
                    get: async () => ({}),
                    set: async () => { }
                }
            }
        } else {
            // Créer de nouveaux credentials
            const { state } = await useMultiFileAuthState(`./auth_sessions/${userId}`)
            authState = state
        }

        // Créer le socket WhatsApp
        const socket = makeWASocket({
            auth: authState,
            printQRInTerminal: true, // Debug: affiche aussi dans le terminal
            logger,
            browser: ['VIBE Agent', 'Chrome', '120.0.0']
        })

        activeSockets.set(userId, socket)

        // Gérer les événements
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                // Générer le QR code en base64
                const qrDataUrl = await QRCode.toDataURL(qr)
                qrCodes.set(userId, qrDataUrl)
                console.log(`[WhatsApp] QR code généré pour user ${userId}`)
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut

                console.log(`[WhatsApp] Connexion fermée pour user ${userId}, code: ${statusCode}`)
                connectionStatus.set(userId, 'disconnected')
                qrCodes.delete(userId)
                activeSockets.delete(userId)

                // Mettre à jour Supabase
                await supabaseAdmin
                    .from('whatsapp_sessions')
                    .update({ is_connected: false })
                    .eq('user_id', userId)

                if (shouldReconnect) {
                    // Reconnexion automatique après 5s
                    setTimeout(() => startWhatsAppSession(userId), 5000)
                }
            }

            if (connection === 'open') {
                console.log(`[WhatsApp] Connecté pour user ${userId}`)
                connectionStatus.set(userId, 'connected')
                qrCodes.delete(userId)

                const phoneNumber = socket.user?.id.split(':')[0] || null

                // Sauvegarder dans Supabase
                await supabaseAdmin
                    .from('whatsapp_sessions')
                    .upsert({
                        user_id: userId,
                        phone_number: phoneNumber,
                        is_connected: true,
                        last_connected_at: new Date().toISOString(),
                        creds: JSON.stringify(authState.creds)
                    }, { onConflict: 'user_id' })
            }
        })

        // Gérer les messages entrants
        socket.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0]
            if (!msg.key.fromMe && m.type === 'notify') {
                const senderPhone = msg.key.remoteJid?.split('@')[0] || ''
                const messageContent = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    '[Media]'

                console.log(`[WhatsApp] Message reçu de ${senderPhone}: ${messageContent}`)

                // Stocker le message dans Supabase
                // TODO: Implémenter la logique de stockage et réponse IA
            }
        })

        // Attendre un peu que le QR soit généré
        await new Promise(resolve => setTimeout(resolve, 2000))

        const qrCode = qrCodes.get(userId)

        return {
            status: 'connecting',
            qrCode: qrCode || undefined,
            message: qrCode ? 'Scannez le QR code' : 'Génération du QR code...'
        }

    } catch (error) {
        console.error('[WhatsApp] Erreur:', error)
        connectionStatus.set(userId, 'disconnected')
        return {
            status: 'error',
            message: 'Erreur lors de la connexion'
        }
    }
}

/**
 * Récupère le statut de connexion d'un utilisateur
 */
export async function getWhatsAppStatus(userId: string): Promise<{
    status: 'disconnected' | 'connecting' | 'connected'
    qrCode?: string
    phoneNumber?: string
}> {
    const status = connectionStatus.get(userId) || 'disconnected'
    const qrCode = qrCodes.get(userId)
    const socket = activeSockets.get(userId)

    return {
        status,
        qrCode: status === 'connecting' ? qrCode : undefined,
        phoneNumber: socket?.user?.id.split(':')[0]
    }
}

/**
 * Déconnecte WhatsApp pour un utilisateur
 */
export async function disconnectWhatsApp(userId: string): Promise<void> {
    const socket = activeSockets.get(userId)

    if (socket) {
        await socket.logout()
        activeSockets.delete(userId)
    }

    qrCodes.delete(userId)
    connectionStatus.set(userId, 'disconnected')

    await supabaseAdmin
        .from('whatsapp_sessions')
        .update({ is_connected: false, creds: null })
        .eq('user_id', userId)
}

/**
 * Envoie un message WhatsApp
 */
export async function sendWhatsAppMessage(
    userId: string,
    phoneNumber: string,
    message: string
): Promise<boolean> {
    const socket = activeSockets.get(userId)

    if (!socket || connectionStatus.get(userId) !== 'connected') {
        console.error('[WhatsApp] Socket non connecté pour envoyer')
        return false
    }

    try {
        const jid = `${phoneNumber}@s.whatsapp.net`
        await socket.sendMessage(jid, { text: message })
        console.log(`[WhatsApp] Message envoyé à ${phoneNumber}`)
        return true
    } catch (error) {
        console.error('[WhatsApp] Erreur envoi:', error)
        return false
    }
}
