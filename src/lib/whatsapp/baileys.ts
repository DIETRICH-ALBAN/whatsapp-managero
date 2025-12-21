/**
 * Service WhatsApp Baileys
 * Gère la connexion via QR Code et la persistance des sessions
 */

import makeWASocket, {
    DisconnectReason,
    WASocket,
    AuthenticationCreds,
    SignalDataTypeMap,
    initAuthCreds,
    BufferJSON
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { EventEmitter } from 'events'

// Types
interface SessionState {
    socket: WASocket | null
    qrCode: string | null
    status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready'
    phoneNumber: string | null
}

// Singleton pour gérer les connexions actives (par userId)
const activeSessions = new Map<string, SessionState>()
const sessionEvents = new EventEmitter()

/**
 * Custom Auth State qui utilise Supabase pour la persistance
 */
async function useSupabaseAuthState(userId: string) {
    // Utilisation directe du client Admin importé
    const supabase = supabaseAdmin

    // Charger ou initialiser les credentials
    const { data: sessionData } = await supabase
        .from('whatsapp_sessions')
        .select('id, creds')
        .eq('user_id', userId)
        .single()

    let sessionId = sessionData?.id
    let creds: AuthenticationCreds = sessionData?.creds
        ? JSON.parse(sessionData.creds, BufferJSON.reviver)
        : initAuthCreds()

    // Créer la session si elle n'existe pas
    if (!sessionId) {
        const { data: newSession } = await supabase
            .from('whatsapp_sessions')
            .insert({ user_id: userId, creds: JSON.stringify(creds, BufferJSON.replacer) })
            .select('id')
            .single()
        sessionId = newSession?.id
    }

    return {
        state: {
            creds,
            keys: {
                get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
                    const result: { [id: string]: SignalDataTypeMap[T] } = {}

                    if (!sessionId) return result

                    const { data } = await supabase
                        .from('whatsapp_session_keys')
                        .select('key_id, key_data')
                        .eq('session_id', sessionId)
                        .in('key_id', ids.map(id => `${type}-${id}`))

                    for (const row of data || []) {
                        const id = row.key_id.replace(`${type}-`, '')
                        result[id] = JSON.parse(row.key_data, BufferJSON.reviver)
                    }

                    return result
                },
                set: async (data: { [category: string]: { [id: string]: SignalDataTypeMap[keyof SignalDataTypeMap] | null } }) => {
                    if (!sessionId) return

                    const inserts: { session_id: string; key_id: string; key_data: string }[] = []
                    const deletes: string[] = []

                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id]
                            const keyId = `${category}-${id}`

                            if (value) {
                                inserts.push({
                                    session_id: sessionId,
                                    key_id: keyId,
                                    key_data: JSON.stringify(value, BufferJSON.replacer)
                                })
                            } else {
                                deletes.push(keyId)
                            }
                        }
                    }

                    if (inserts.length > 0) {
                        await supabase.from('whatsapp_session_keys').upsert(inserts, { onConflict: 'session_id,key_id' })
                    }

                    if (deletes.length > 0) {
                        await supabase
                            .from('whatsapp_session_keys')
                            .delete()
                            .eq('session_id', sessionId)
                            .in('key_id', deletes)
                    }
                }
            }
        },
        saveCreds: async () => {
            if (!sessionId) return

            await supabase
                .from('whatsapp_sessions')
                .update({
                    creds: JSON.stringify(creds, BufferJSON.replacer),
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)
        },
        sessionId
    }
}

/**
 * Démarre une nouvelle connexion WhatsApp pour un utilisateur
 */
export async function startWhatsAppSession(userId: string): Promise<{ qrCode?: string; status: string }> {
    // Vérifier si une session existe déjà
    let session = activeSessions.get(userId)

    if (session?.status === 'connected') {
        return { status: 'connected' }
    }

    if (session?.status === 'qr_ready' && session.qrCode) {
        return { qrCode: session.qrCode, status: 'qr_ready' }
    }

    // Initialiser la session
    session = {
        socket: null,
        qrCode: null,
        status: 'connecting',
        phoneNumber: null
    }
    activeSessions.set(userId, session)

    try {
        const { state, saveCreds } = await useSupabaseAuthState(userId)

        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['Vibe WhatsApp Manager', 'Chrome', '120.0.0'],
            syncFullHistory: true
        })

        session.socket = socket

        // Gestionnaire de connexion
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            const supabase = supabaseAdmin

            if (qr) {
                // Convertir le QR en image base64
                const QRCode = await import('qrcode')
                const qrBase64 = await QRCode.toDataURL(qr)

                session!.qrCode = qrBase64
                session!.status = 'qr_ready'
                sessionEvents.emit(`qr:${userId}`, qrBase64)
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

                session!.status = 'disconnected'
                session!.socket = null

                if (shouldReconnect) {
                    // Reconnecter après un délai
                    setTimeout(() => startWhatsAppSession(userId), 5000)
                } else {
                    // Nettoyage si déconnexion volontaire
                    activeSessions.delete(userId)
                    await supabase.from('whatsapp_sessions').update({ is_connected: false }).eq('user_id', userId)
                }
            } else if (connection === 'open') {
                session!.status = 'connected'
                session!.qrCode = null
                session!.phoneNumber = socket.user?.id?.split(':')[0] || null

                await supabase.from('whatsapp_sessions').update({
                    is_connected: true,
                    last_connected_at: new Date().toISOString(),
                    phone_number: session!.phoneNumber
                }).eq('user_id', userId)

                sessionEvents.emit(`connected:${userId}`)
            }
        })

        // Gestionnaire de credentials
        socket.ev.on('creds.update', saveCreds)

        // Gestionnaire de messages
        socket.ev.on('messages.upsert', async ({ messages }) => {
            const supabase = supabaseAdmin
            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    // Nouveau message entrant

                    const contactPhone = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || ''
                    const contactName = msg.pushName || contactPhone
                    const content = msg.message.conversation ||
                        msg.message.extendedTextMessage?.text ||
                        '[Media]'

                    // Upsert conversation
                    const { data: convo } = await supabase
                        .from('conversations')
                        .upsert({
                            contact_phone: contactPhone,
                            contact_name: contactName,
                            last_message: content,
                            last_message_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'contact_phone' })
                        .select('id, unread_count')
                        .single()

                    if (convo) {
                        // Incrémenter unread_count
                        await supabase.from('conversations').update({
                            unread_count: (convo.unread_count || 0) + 1
                        }).eq('id', convo.id)

                        // Insérer le message
                        await supabase.from('messages').insert({
                            conversation_id: convo.id,
                            contact_phone: contactPhone,
                            contact_name: contactName,
                            content,
                            direction: 'inbound',
                            status: 'received',
                            platform: 'whatsapp'
                        })
                    }
                }
            }
        })

        return { status: 'connecting' }

    } catch (error) {
        console.error('Erreur démarrage session WhatsApp:', error)
        activeSessions.delete(userId)
        throw error
    }
}

/**
 * Récupère le statut actuel de la session
 */
export function getSessionStatus(userId: string): SessionState | null {
    return activeSessions.get(userId) || null
}

/**
 * Envoie un message via la session active
 */
export async function sendMessage(userId: string, to: string, text: string): Promise<boolean> {
    const session = activeSessions.get(userId)

    if (!session?.socket || session.status !== 'connected') {
        throw new Error('Session WhatsApp non connectée')
    }

    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`
        await session.socket.sendMessage(jid, { text })
        return true
    } catch (error) {
        console.error('Erreur envoi message:', error)
        return false
    }
}

/**
 * Déconnecte la session
 */
export async function disconnectSession(userId: string): Promise<void> {
    const session = activeSessions.get(userId)
    const supabase = supabaseAdmin

    if (session?.socket) {
        await session.socket.logout()
        session.socket = null
    }

    activeSessions.delete(userId)

    await supabase.from('whatsapp_sessions').update({ is_connected: false }).eq('user_id', userId)
}

// Export de l'event emitter pour le SSE
export { sessionEvents }
