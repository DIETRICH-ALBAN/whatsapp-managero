/**
 * VIBE Agent - WhatsApp Service (Stable ESM & Supabase Auth)
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} from '@whiskeysockets/baileys'

import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { useSupabaseAuthState } from './supabaseAuth.js'

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
    if (req.url !== '/health') console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

const activeSockets = new Map()
const qrCodes = new Map()
const connectionStatus = new Map()
const pairingCodes = new Map()
const preferredMethod = new Map() // 'qr' ou 'code'
const pendingPairing = new Map()
const pairingCodeRequested = new Map() // Lock anti-boucle
const sessionStartTimes = new Map()

const authMiddleware = (req, res, next) => {
    if (req.headers['x-api-secret'] !== API_SECRET) {
        return res.status(401).json({ error: 'Non autorisé' })
    }
    next()
}

app.get('/', (req, res) => res.json({ status: 'online', service: 'VIBE WhatsApp' }))
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), memory: process.memoryUsage() }))

setInterval(() => {
    console.log(`[Health] Service actif - Sockets: ${activeSockets.size}`)
}, 600000)

// Fonction pour restaurer les sessions actives au redémarrage
async function restoreSessions() {
    console.log('[Restore] Vérification des sessions à restaurer...')
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const { data: sessions } = await supabase.from('whatsapp_sessions').select('user_id').eq('is_connected', true)

        if (sessions && sessions.length > 0) {
            console.log(`[Restore] ${sessions.length} sessions trouvées. Redémarrage...`)
            for (const s of sessions) {
                if (!activeSockets.has(s.user_id)) {
                    startSession(s.user_id).catch(err => console.error(`[Restore] Echec pour ${s.user_id}`, err))
                }
            }
        } else {
            console.log('[Restore] Aucune session active à restaurer.')
        }
    } catch (error) {
        console.error('[Restore] Erreur:', error)
    }
}
setTimeout(restoreSessions, 5000)

async function startSession(userId, phoneNumber = null) {
    const isCodeMode = !!phoneNumber
    preferredMethod.set(userId, isCodeMode ? 'code' : 'qr')
    qrCodes.delete(userId)
    pairingCodes.delete(userId)
    pairingCodeRequested.delete(userId)

    if (isCodeMode) pendingPairing.set(userId, phoneNumber.replace(/\D/g, ''))
    else pendingPairing.delete(userId)

    if (activeSockets.has(userId) && connectionStatus.get(userId) !== 'connected') {
        try {
            activeSockets.get(userId).end(undefined)
            activeSockets.delete(userId)
        } catch (e) { }
    }

    if (activeSockets.has(userId)) {
        return {
            status: connectionStatus.get(userId) || 'connecting',
            qrCode: qrCodes.get(userId),
            pairingCode: pairingCodes.get(userId)
        }
    }

    try {
        console.log(`[Session] Initialisation ${userId} (${isCodeMode ? 'CODE' : 'QR'})`)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        // Utilisation du AuthState DB
        const { state, saveCreds } = await useSupabaseAuthState(supabase, userId)
        const { version } = await fetchLatestBaileysVersion()

        const socketConfig = {
            version,
            auth: state,
            browser: ['Ubuntu', 'Chrome', '110.0.5481.100'],
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true
        }

        const socket = makeWASocket.default ? makeWASocket.default(socketConfig) : makeWASocket(socketConfig)

        activeSockets.set(userId, socket)
        connectionStatus.set(userId, 'connecting')

        socket.ev.on('creds.update', saveCreds)

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                const phone = pendingPairing.get(userId)
                if (phone) {
                    if (!pairingCodeRequested.get(userId)) {
                        pairingCodeRequested.set(userId, true)
                        console.log(`[Pairing] Signal QR reçu. Attente de 5s...`)
                        setTimeout(async () => {
                            try {
                                const code = await socket.requestPairingCode(phone)
                                pairingCodes.set(userId, code)
                                qrCodes.delete(userId)
                                pendingPairing.delete(userId)
                            } catch (err) {
                                pairingCodes.set(userId, "ERREUR")
                                pairingCodeRequested.set(userId, false)
                            }
                        }, 5000)
                    }
                } else {
                    const qrData = await QRCode.toDataURL(qr)
                    qrCodes.set(userId, qrData)
                    pairingCodes.delete(userId)
                }
            }

            if (connection === 'open') {
                console.log(`[Connexion] Connecté ! ${userId}`)
                connectionStatus.set(userId, 'connected')
                sessionStartTimes.set(userId, new Date().toISOString())
                qrCodes.delete(userId)
                pairingCodes.delete(userId)

                await saveCreds() // Force save
                await supabase.from('whatsapp_sessions').update({
                    is_connected: true,
                    last_connected_at: new Date().toISOString()
                }).eq('user_id', userId)
            }

            if (connection === 'close') {
                const errorCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0
                const shouldReconnect = errorCode !== DisconnectReason.loggedOut
                console.log(`[Connexion] Fermée (${errorCode}). Reconnexion: ${shouldReconnect}`)
                activeSockets.delete(userId)
                connectionStatus.set(userId, 'disconnected')
                if (shouldReconnect) setTimeout(() => startSession(userId), 5000)
            }
        })

        socket.ev.on('messages.upsert', async (m) => {
            const messages = m.messages
            for (const msg of messages) {
                try {
                    if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                    const jid = msg.key.remoteJid
                    const senderNumber = jid.split('@')[0]
                    const contactName = msg.pushName || senderNumber

                    let messageContent = null
                    let messageType = 'text'
                    let mediaUrl = null

                    if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
                        messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text
                    } else if (msg.message?.imageMessage) {
                        messageContent = msg.message.imageMessage.caption || '📷 Image'
                        messageType = 'image'
                    } else if (msg.message?.videoMessage) {
                        messageContent = msg.message.videoMessage.caption || '🎬 Vidéo'
                        messageType = 'video'
                    } else if (msg.message?.audioMessage) {
                        messageContent = '🎤 Message vocal'
                        messageType = 'audio'
                    } else if (msg.message?.documentMessage) {
                        messageContent = `📄 ${msg.message.documentMessage.fileName || 'Document'}`
                        messageType = 'document'
                    } else if (msg.message?.stickerMessage) {
                        messageContent = '🎭 Sticker'
                        messageType = 'sticker'
                    }

                    if (!messageContent) continue

                    // Media Handling
                    if (['image', 'video', 'audio', 'document'].includes(messageType)) {
                        try {
                            const buffer = await downloadMediaMessage(msg, 'buffer', {})
                            const ext = messageType === 'image' ? 'jpg' : messageType === 'video' ? 'mp4' : messageType === 'audio' ? 'ogg' : 'bin'
                            const fileName = `${userId}/${Date.now()}_${senderNumber}.${ext}`
                            const { data: uploadData, error: uploadError } = await supabase.storage.from('whatsapp-media').upload(fileName, buffer, { contentType: `${messageType}/*`, upsert: true })
                            if (!uploadError) {
                                const { data: publicUrl } = supabase.storage.from('whatsapp-media').getPublicUrl(fileName)
                                mediaUrl = publicUrl.publicUrl
                            }
                        } catch (e) {
                            console.error('[Media] Error:', e.message)
                        }
                    }

                    // Group / Contact Name
                    let finalContactName = contactName
                    if (jid.endsWith('@g.us')) {
                        try {
                            const groupMetadata = await socket.groupMetadata(jid)
                            finalContactName = groupMetadata.subject
                        } catch (e) { }
                    }

                    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatsapp-managero.vercel.app'
                    let { data: conversation } = await supabase.from('conversations').select('*').eq('user_id', userId).eq('contact_phone', senderNumber).single()

                    if (!conversation) {
                        const { data: newC } = await supabase.from('conversations').insert({
                            user_id: userId, contact_phone: senderNumber, contact_name: finalContactName,
                            last_message: messageContent, last_message_at: new Date().toISOString(), unread_count: 1
                        }).select().single()
                        conversation = newC
                    } else {
                        const updateData = { last_message: messageContent, last_message_at: new Date().toISOString(), unread_count: (conversation.unread_count || 0) + 1 }
                        if (finalContactName && finalContactName !== senderNumber) updateData.contact_name = finalContactName
                        await supabase.from('conversations').update(updateData).eq('id', conversation.id)
                    }

                    // Insert Message
                    const msgPayload = { conversation_id: conversation.id, contact_phone: senderNumber, content: messageContent, direction: 'inbound', status: 'received' }
                    if (messageType !== 'text') msgPayload.message_type = messageType
                    if (mediaUrl) msgPayload.media_url = mediaUrl
                    await supabase.from('messages').insert(msgPayload)

                    // AI Auto-Reply
                    if (conversation.is_ai_enabled && conversation.agent_id) {
                        try {
                            await socket.sendPresenceUpdate('composing', jid)
                            const aiRes = await fetch(`${SITE_URL}/api/ai/chat`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET },
                                body: JSON.stringify({ conversationId: conversation.id, message: messageContent, agentId: conversation.agent_id })
                            })
                            const aiData = await aiRes.json()
                            if (aiData.response) {
                                await socket.sendMessage(jid, { text: aiData.response })
                                await supabase.from('messages').insert({
                                    conversation_id: conversation.id, contact_phone: senderNumber,
                                    content: aiData.response, direction: 'outbound', status: 'sent', is_ai_generated: true
                                })
                            }
                        } catch (aiErr) { console.error('[AI] Erreur:', aiErr) }
                    }
                } catch (msgErr) { console.error('[Error processing message]', msgErr) }
            }
        })

        return { status: 'connecting' }
    } catch (e) {
        console.error(`[CRASH] ${userId}:`, e.message)
        return { status: 'error', message: e.message }
    }
}

app.post('/connect/:userId', authMiddleware, async (req, res) => {
    res.json(await startSession(req.params.userId, req.body.phoneNumber))
})

app.get('/status/:userId', authMiddleware, async (req, res) => {
    const userId = req.params.userId
    const socket = activeSockets.get(userId)
    let profilePic = null
    if (socket && connectionStatus.get(userId) === 'connected') {
        try { profilePic = await socket.profilePictureUrl(socket.user.id, 'image') } catch (e) { }
    }
    res.json({
        status: connectionStatus.get(userId) || 'disconnected',
        method: preferredMethod.get(userId) || 'qr',
        qrCode: qrCodes.get(userId),
        pairingCode: pairingCodes.get(userId),
        phoneNumber: socket?.user?.id.split(':')[0],
        sessionStartTime: sessionStartTimes.get(userId),
        profilePic
    })
})

app.post('/send/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const { phoneNumber, message } = req.body
    const socket = activeSockets.get(userId)
    if (!socket || connectionStatus.get(userId) !== 'connected') return res.status(400).json({ error: 'WhatsApp non connecté' })
    try {
        const jid = `${phoneNumber}@s.whatsapp.net`
        await socket.sendMessage(jid, { text: message })
        res.json({ success: true })
    } catch (error) { res.status(500).json({ error: error.message }) }
})

app.post('/send-media/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const { phoneNumber, mediaUrl, caption, type } = req.body
    const socket = activeSockets.get(userId)
    if (!socket || connectionStatus.get(userId) !== 'connected') return res.status(400).json({ error: 'WhatsApp non connecté' })
    try {
        const jid = `${phoneNumber.includes('-') ? phoneNumber : phoneNumber + '@s.whatsapp.net'}`
        let messageOptions = {}
        if (type === 'image') messageOptions = { image: { url: mediaUrl }, caption }
        else if (type === 'video') messageOptions = { video: { url: mediaUrl }, caption }
        else if (type === 'audio') messageOptions = { audio: { url: mediaUrl }, mimetype: 'audio/mp4', ptt: true }
        else messageOptions = { document: { url: mediaUrl }, fileName: caption || 'file', mimetype: 'application/octet-stream' }
        await socket.sendMessage(jid, messageOptions)
        res.json({ success: true })
    } catch (error) { res.status(500).json({ error: error.message }) }
})

app.delete('/disconnect/:userId', authMiddleware, async (req, res) => {
    const userId = req.params.userId
    if (activeSockets.has(userId)) {
        try { await activeSockets.get(userId).logout() } catch (e) { }
        activeSockets.delete(userId)
    }
    connectionStatus.set(userId, 'disconnected')
    qrCodes.delete(userId)
    pairingCodes.delete(userId)
    res.json({ success: true })
})

app.listen(PORT, HOST, () => console.log(`🚀 Microservice prêt sur ${PORT}`))
