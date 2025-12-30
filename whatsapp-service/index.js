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
const pairingCodes = new Map()
const preferredMethod = new Map() // 'qr' ou 'code'

const authMiddleware = (req, res, next) => {
    if (req.headers['x-api-secret'] !== API_SECRET) {
        return res.status(401).json({ error: 'Non autorisé' })
    }
    next()
}

app.get('/', (req, res) => res.json({ status: 'online', service: 'VIBE WhatsApp' }))
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), memory: process.memoryUsage() }))

// Log de santé périodique
setInterval(() => {
    console.log(`[Health] Service actif - ${new Date().toISOString()} - Sockets: ${activeSockets.size}`)
}, 600000) // Toutes les 10 minutes

async function startSession(userId, phoneNumber = null) {
    preferredMethod.set(userId, phoneNumber ? 'code' : 'qr')

    // Fonction helper pour générer le code
    const triggerPairingCode = async (socket, phone) => {
        if (!phone) return
        qrCodes.delete(userId)
        setTimeout(async () => {
            try {
                const cleanPhone = phone.replace(/\D/g, '')
                console.log(`[Pairing] Demande code pour: ${cleanPhone}`)
                const code = await socket.requestPairingCode(cleanPhone)
                console.log(`[Pairing] Code reçu: ${code}`)
                pairingCodes.set(userId, code)
            } catch (err) {
                console.error(`[Pairing] Erreur WhatsApp:`, err.message)
            }
        }, 1000)
    }

    if (activeSockets.has(userId)) {
        console.log(`[Session] Session existante pour ${userId}`)
        const socket = activeSockets.get(userId)
        if (phoneNumber && connectionStatus.get(userId) !== 'connected') {
            await triggerPairingCode(socket, phoneNumber)
        }
        return {
            status: connectionStatus.get(userId) || 'connecting',
            qrCode: qrCodes.get(userId),
            pairingCode: pairingCodes.get(userId)
        }
    }

    try {
        console.log(`[Session] Démarrage pour ${userId} ${phoneNumber ? `(Numéro: ${phoneNumber})` : ''}`)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const sessionDir = path.join(__dirname, 'sessions')
        const sessionPath = path.join(sessionDir, userId)

        // Nettoyage dossier au cas où
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

        // 1. Restaurer depuis Supabase si le dossier est vide
        if (!fs.existsSync(path.join(sessionPath, 'creds.json'))) {
            console.log(`[Session] Restauration depuis Supabase pour ${userId}...`)
            const { data: session } = await supabase
                .from('whatsapp_sessions')
                .select('creds')
                .eq('user_id', userId)
                .single()

            if (session?.creds) {
                if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true })
                fs.writeFileSync(path.join(sessionPath, 'creds.json'), session.creds)
                console.log(`[Session] Creds restaurés avec succès`)
            }
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        const { version } = await fetchLatestBaileysVersion()

        const socket = makeWASocket.default ? makeWASocket.default({
            version,
            auth: state,
            printQRInTerminal: true,
            browser: ['VibeVendor', 'Chrome', '1.0.0'],
            logger: pino({ level: 'info' }),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            generateHighQualityLinkPreview: true
        }) : makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            browser: ['VibeVendor', 'Chrome', '1.0.0'],
            logger: pino({ level: 'info' }),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            generateHighQualityLinkPreview: true
        })

        activeSockets.set(userId, socket)
        connectionStatus.set(userId, 'connecting')

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) {
                console.log(`[QR] Nouveau signal reçu pour ${userId}`)
                const qrData = await QRCode.toDataURL(qr)
                qrCodes.set(userId, qrData)
                // On ne touche plus à pairingCodes ici pour éviter la disparition éclair
            }

            if (connection === 'open') {
                console.log(`[Connexion] Succès pour ${userId}`)
                connectionStatus.set(userId, 'connected')
                qrCodes.delete(userId)
                pairingCodes.delete(userId)

                await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    phone_number: socket.user?.id.split(':')[0],
                    is_connected: true,
                    last_connected_at: new Date().toISOString()
                })
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
                    : true

                activeSockets.delete(userId)
                connectionStatus.set(userId, 'disconnected')
                qrCodes.delete(userId)
                pairingCodes.delete(userId)

                if (shouldReconnect) {
                    console.log(`[Connexion] Reconnexion automatique pour ${userId} dans 5s...`)
                    setTimeout(() => startSession(userId), 5000)
                }
            }
        })

        socket.ev.on('creds.update', async () => {
            await saveCreds()
            try {
                const credsContent = fs.readFileSync(path.join(sessionPath, 'creds.json'), 'utf-8')
                await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    creds: credsContent,
                    is_connected: connectionStatus.get(userId) === 'connected',
                    updated_at: new Date().toISOString()
                })
            } catch (err) {
                console.error(`[Session] Erreur sauvegarde Supabase:`, err.message)
            }
        })

        // === ÉCOUTE DES MESSAGES ENTRANTS ===
        socket.ev.on('messages.upsert', async (m) => {
            const messages = m.messages
            for (const msg of messages) {
                if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                const jid = msg.key.remoteJid
                const isGroup = jid.endsWith('@g.us')
                const senderNumber = jid.split('@')[0]
                const contactName = msg.pushName || senderNumber

                let messageContent = ''
                let messageType = 'text'

                if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
                    messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text
                } else if (msg.message?.imageMessage) {
                    messageContent = '📷 Photo'
                    messageType = 'image'
                } else if (msg.message?.videoMessage) {
                    messageContent = '🎥 Vidéo'
                    messageType = 'video'
                } else if (msg.message?.audioMessage) {
                    messageContent = '🎵 Audio'
                    messageType = 'audio'
                } else if (msg.message?.documentMessage) {
                    messageContent = '📄 Document'
                    messageType = 'document'
                } else {
                    messageContent = '[Média]'
                    messageType = 'other'
                }

                if (!messageContent) continue
                console.log(`[Message] ${isGroup ? '(Groupe)' : '(Privé)'} ${contactName}: ${messageContent}`)

                try {
                    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatsapp-managero.vercel.app'

                    // 1. Trouver ou créer la conversation
                    let { data: conversation } = await supabase
                        .from('conversations')
                        .select('id, contact_name, agent_id, is_ai_enabled, unread_count')
                        .eq('user_id', userId)
                        .eq('contact_phone', senderNumber)
                        .single()

                    // Analyse d'intention (IA)
                    let analysis = null
                    if (!isGroup && messageType === 'text') {
                        try {
                            const analyzeRes = await fetch(`${SITE_URL}/api/ai/analyze`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET },
                                body: JSON.stringify({ message: messageContent })
                            })
                            analysis = await analyzeRes.json()
                        } catch (err) { console.error('[Analyze] Erreur:', err.message) }
                    }

                    if (!conversation) {
                        const { data: newConvo } = await supabase
                            .from('conversations')
                            .insert({
                                user_id: userId,
                                contact_phone: senderNumber,
                                contact_name: contactName,
                                last_message: messageContent,
                                last_message_at: new Date().toISOString(),
                                unread_count: 1,
                                intent_tag: analysis?.intent || null,
                                agent_id: analysis?.suggestedAgentId || null
                            })
                            .select()
                            .single()
                        conversation = newConvo
                    } else {
                        await supabase.from('conversations').update({
                            last_message: messageContent,
                            last_message_at: new Date().toISOString(),
                            unread_count: (conversation.unread_count || 0) + 1,
                            intent_tag: analysis?.intent || conversation.intent_tag,
                            agent_id: analysis?.suggestedAgentId || conversation.agent_id
                        }).eq('id', conversation.id)
                    }

                    // 2. Enregistrer le message
                    await supabase.from('messages').insert({
                        conversation_id: conversation.id,
                        contact_phone: senderNumber,
                        content: messageContent,
                        direction: 'inbound',
                        status: 'received',
                        message_type: messageType
                    })

                    // 3. IA : Répondre si activé
                    if (!isGroup && conversation && (conversation.is_ai_enabled)) {
                        const agentId = conversation.agent_id
                        const { data: agentConfig } = await supabase
                            .from('agent_configs')
                            .select('*')
                            .eq('id', agentId)
                            .single()

                        if (agentConfig?.is_active) {
                            try {
                                await socket.sendPresenceUpdate('composing', jid)
                                await new Promise(resolve => setTimeout(resolve, 3000))

                                const aiResponse = await fetch(`${SITE_URL}/api/ai/chat`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET },
                                    body: JSON.stringify({
                                        conversationId: conversation.id,
                                        message: messageContent,
                                        agentId: agentConfig.id
                                    })
                                })

                                const aiData = await aiResponse.json()
                                if (aiData.response) {
                                    await socket.sendMessage(jid, { text: aiData.response })
                                    await socket.sendPresenceUpdate('paused', jid)

                                    await supabase.from('messages').insert({
                                        conversation_id: conversation.id,
                                        contact_phone: senderNumber,
                                        content: aiData.response,
                                        direction: 'outbound',
                                        status: 'sent',
                                        is_ai_generated: true
                                    })

                                    await supabase.from('conversations').update({
                                        last_message: aiData.response,
                                        last_message_at: new Date().toISOString()
                                    }).eq('id', conversation.id)
                                }
                            } catch (aiErr) { console.error(`[IA] Erreur:`, aiErr.message) }
                        }
                    }
                } catch (dbError) { console.error(`[DB] Erreur:`, dbError.message) }
            }
        })

        // Nouveau: Si un numéro est fourni, générer un code de couplage (Pairing Code)
        if (phoneNumber) {
            await triggerPairingCode(socket, phoneNumber)
        }

        return { status: 'connecting' }
    } catch (e) {
        console.error(`[CRASH] ${userId}:`, e.message)
        return { status: 'error', message: e.message }
    }
}

// === ROUTES API ===
app.post('/connect/:userId', authMiddleware, async (req, res) => {
    const { phoneNumber } = req.body
    res.json(await startSession(req.params.userId, phoneNumber))
})

app.get('/status/:userId', authMiddleware, (req, res) => {
    const method = preferredMethod.get(req.params.userId) || 'qr'
    res.json({
        status: connectionStatus.get(req.params.userId) || 'disconnected',
        method: method,
        qrCode: method === 'code' ? null : qrCodes.get(req.params.userId),
        pairingCode: pairingCodes.get(req.params.userId),
        phoneNumber: activeSockets.get(req.params.userId)?.user?.id.split(':')[0]
    })
})

app.get('/debug/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId
    res.json({
        hasSocket: activeSockets.has(userId),
        status: connectionStatus.get(userId),
        hasQr: !!qrCodes.get(userId),
        hasPairingCode: !!pairingCodes.get(userId),
        sessionExists: fs.existsSync(path.join(__dirname, 'sessions', userId))
    })
})

app.delete('/disconnect/:userId', authMiddleware, async (req, res) => {
    const userId = req.params.userId
    const socket = activeSockets.get(userId)
    if (socket) {
        try { await socket.logout() } catch (e) { }
        activeSockets.delete(userId)
        connectionStatus.set(userId, 'disconnected')
    }
    // Nettoyage complet
    qrCodes.delete(userId)
    pairingCodes.delete(userId)
    preferredMethod.delete(userId)

    res.json({ success: true })
})

app.post('/send/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const { phoneNumber, message } = req.body

    const socket = activeSockets.get(userId)
    if (!socket) return res.status(400).json({ error: 'WhatsApp non connecté' })

    try {
        const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`
        await socket.sendMessage(jid, { text: message })
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: 'Échec envoi', details: error.message })
    }
})

app.listen(PORT, HOST, () => console.log(`🚀 Microservice prêt sur ${PORT}`))
