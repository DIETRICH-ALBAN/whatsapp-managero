/**
 * VIBE Agent - WhatsApp Service (Stable ESM)
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
// Importation directe des fonctions pour éviter l'erreur "not a function"
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3000
const HOST = '0.0.0.0'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const API_SECRET = process.env.API_SECRET || 'vibe_vendor_secure_2024'

const app = express()
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

const activeSockets = new Map()
const qrCodes = new Map()
const connectionStatus = new Map()

const authMiddleware = (req, res, next) => {
    if (req.headers['x-api-secret'] !== API_SECRET) {
        return res.status(401).json({ error: 'Non autorisé' })
    }
    next()
}

app.get('/', (req, res) => res.json({ status: 'online', service: 'VIBE WhatsApp' }))

async function startSession(userId) {
    if (activeSockets.has(userId)) return { status: connectionStatus.get(userId) || 'connecting' }

    try {
        console.log(`[Session] Démarrage pour ${userId}`)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const sessionDir = path.join(__dirname, 'sessions')
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

        const sessionPath = path.join(sessionDir, userId)

        // --- FIX CRITIQUE ---
        // On vérifie que la fonction existe bien avant de l'appeler
        if (typeof useMultiFileAuthState !== 'function') {
            throw new Error("Erreur d'importation Baileys: useMultiFileAuthState n'est pas une fonction");
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        const { version } = await fetchLatestBaileysVersion()

        const socket = makeWASocket.default ? makeWASocket.default({
            version,
            auth: state,
            browser: ['VIBE Agent', 'Chrome', '120.0.0'],
            logger: pino({ level: 'silent' })
        }) : makeWASocket({
            version,
            auth: state,
            browser: ['VIBE Agent', 'Chrome', '120.0.0'],
            logger: pino({ level: 'silent' })
        })

        activeSockets.set(userId, socket)
        connectionStatus.set(userId, 'connecting')

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) {
                console.log(`[QR] Nouveau code pour ${userId}`)
                qrCodes.set(userId, await QRCode.toDataURL(qr))
            }

            if (connection === 'open') {
                console.log(`[Connexion] Succès pour ${userId}`)
                connectionStatus.set(userId, 'connected')
                qrCodes.delete(userId)
                await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    phone_number: socket.user?.id.split(':')[0],
                    is_connected: true,
                    last_connected_at: new Date().toISOString()
                })
            }

            if (connection === 'close') {
                activeSockets.delete(userId)
                connectionStatus.set(userId, 'disconnected')
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
                    : true
                if (shouldReconnect) setTimeout(() => startSession(userId), 5000)
            }
        })

        socket.ev.on('creds.update', saveCreds)

        // === ÉCOUTE DES MESSAGES ENTRANTS ===
        socket.ev.on('messages.upsert', async (m) => {
            const messages = m.messages
            for (const msg of messages) {
                // Ignorer les messages de statut et les messages envoyés par nous
                if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                const senderNumber = msg.key.remoteJid.split('@')[0]
                const messageContent = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    '[Média non supporté]'

                console.log(`[Message] Nouveau de ${senderNumber}: ${messageContent.substring(0, 50)}...`)

                try {
                    // 1. Trouver ou créer la conversation
                    let { data: conversation } = await supabase
                        .from('conversations')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('contact_phone', senderNumber)
                        .single()

                    if (!conversation) {
                        const { data: newConvo } = await supabase
                            .from('conversations')
                            .insert({
                                user_id: userId,
                                contact_phone: senderNumber,
                                contact_name: senderNumber,
                                last_message: messageContent,
                                unread_count: 1
                            })
                            .select('id')
                            .single()
                        conversation = newConvo
                    } else {
                        // Mettre à jour la conversation existante
                        await supabase
                            .from('conversations')
                            .update({
                                last_message: messageContent,
                                last_message_at: new Date().toISOString(),
                                unread_count: supabase.sql`unread_count + 1`
                            })
                            .eq('id', conversation.id)
                    }

                    // 2. Enregistrer le message
                    await supabase.from('messages').insert({
                        conversation_id: conversation.id,
                        contact_phone: senderNumber,
                        content: messageContent,
                        direction: 'inbound',
                        status: 'received'
                    })

                    console.log(`[Message] Enregistré dans conversation ${conversation.id}`)
                } catch (dbError) {
                    console.error(`[Message] Erreur DB:`, dbError.message)
                }
            }
        })

        return { status: 'connecting' }
    } catch (e) {
        console.error(`[CRASH] ${userId}:`, e.message)
        return { status: 'error', message: e.message }
    }
}

app.post('/connect/:userId', authMiddleware, async (req, res) => res.json(await startSession(req.params.userId)))
app.get('/status/:userId', authMiddleware, (req, res) => {
    res.json({
        status: connectionStatus.get(req.params.userId) || 'disconnected',
        qrCode: qrCodes.get(req.params.userId),
        phoneNumber: activeSockets.get(req.params.userId)?.user?.id.split(':')[0]
    })
})
app.delete('/disconnect/:userId', authMiddleware, async (req, res) => {
    const socket = activeSockets.get(req.params.userId)
    if (socket) {
        try { await socket.logout() } catch (e) { }
        activeSockets.delete(req.params.userId)
        connectionStatus.set(req.params.userId, 'disconnected')
    }
    res.json({ success: true })
})

app.listen(PORT, HOST, () => console.log(`🚀 Microservice prêt sur ${PORT}`))
