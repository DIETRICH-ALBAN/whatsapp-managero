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
    if (req.url !== '/health') console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

const activeSockets = new Map()
const qrCodes = new Map()
const connectionStatus = new Map()
const pairingCodes = new Map()
const preferredMethod = new Map() // 'qr' ou 'code'
const pendingPairing = new Map()

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
    console.log(`[Health] Service actif - Sockets: ${activeSockets.size}`)
}, 600000)

async function startSession(userId, phoneNumber = null) {
    const isCodeMode = !!phoneNumber
    preferredMethod.set(userId, isCodeMode ? 'code' : 'qr')

    // Reset immédiat des états d'affichage
    qrCodes.delete(userId)
    pairingCodes.delete(userId)

    if (isCodeMode) {
        pendingPairing.set(userId, phoneNumber.replace(/\D/g, ''))
    } else {
        pendingPairing.delete(userId)
    }

    const sessionDir = path.join(__dirname, 'sessions')
    const sessionPath = path.join(sessionDir, userId)

    // FORCE RESET : Si on demande une nouvelle connexion (non connectée)
    if (activeSockets.has(userId) && connectionStatus.get(userId) !== 'connected') {
        console.log(`[Session] Reset socket pour rafraîchir QR/Code: ${userId}`)
        try {
            activeSockets.get(userId).end(undefined)
            activeSockets.delete(userId)
        } catch (e) { }
    }

    // Si on demande un nouveau Pairing Code, on force le nettoyage du dossier session
    if (isCodeMode && fs.existsSync(sessionPath)) {
        console.log(`[Pairing] Fresh restart session folder for ${userId}`)
        try { fs.rmSync(sessionPath, { recursive: true, force: true }) } catch (e) { }
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
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

        // Restauration uniquement pour QR classique
        if (!isCodeMode && !fs.existsSync(path.join(sessionPath, 'creds.json'))) {
            const { data: session } = await supabase.from('whatsapp_sessions').select('creds').eq('user_id', userId).single()
            if (session?.creds) {
                if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true })
                fs.writeFileSync(path.join(sessionPath, 'creds.json'), session.creds)
            }
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        const { version } = await fetchLatestBaileysVersion()

        const socketConfig = {
            version,
            auth: state,
            // Signature importante pour la compatibilité Pairing Code
            browser: ['Mac OS', 'Safari', '110.0.5481.100'],
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000
        }

        const socket = makeWASocket.default ? makeWASocket.default(socketConfig) : makeWASocket(socketConfig)

        activeSockets.set(userId, socket)
        connectionStatus.set(userId, 'connecting')

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                const phone = pendingPairing.get(userId)
                if (phone) {
                    console.log(`[Pairing] Signal QR intercepté. Demande code pour ${phone}...`)
                    try {
                        const code = await socket.requestPairingCode(phone)
                        console.log(`[Pairing] SUCCÈS Code: ${code}`)
                        pairingCodes.set(userId, code)
                        qrCodes.delete(userId)
                        pendingPairing.delete(userId)
                    } catch (err) {
                        console.error(`[Pairing] Échec:`, err.message)
                        pairingCodes.set(userId, "ERREUR")
                    }
                } else {
                    console.log(`[QR] Image générée pour ${userId}`)
                    const qrData = await QRCode.toDataURL(qr)
                    qrCodes.set(userId, qrData)
                    pairingCodes.delete(userId)
                }
            }

            if (connection === 'open') {
                console.log(`[Connexion] Connecté ! ${userId}`)
                connectionStatus.set(userId, 'connected')
                qrCodes.delete(userId)
                pairingCodes.delete(userId)
                pendingPairing.delete(userId)

                await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    phone_number: socket.user?.id.split(':')[0],
                    is_connected: true,
                    last_connected_at: new Date().toISOString()
                })
            }

            if (connection === 'close') {
                const errorCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0
                const shouldReconnect = errorCode !== DisconnectReason.loggedOut

                console.log(`[Connexion] Fermée (${errorCode}). Reconnexion: ${shouldReconnect}`)

                activeSockets.delete(userId)
                connectionStatus.set(userId, 'disconnected')

                if (shouldReconnect) {
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
            } catch (err) { }
        })

        socket.ev.on('messages.upsert', async (m) => {
            const messages = m.messages
            for (const msg of messages) {
                if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                const jid = msg.key.remoteJid
                const senderNumber = jid.split('@')[0]
                const contactName = msg.pushName || senderNumber

                let messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Média]'
                if (!messageContent || messageContent === '[Média]') continue

                try {
                    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatsapp-managero.vercel.app'

                    let { data: conversation } = await supabase.from('conversations')
                        .select('*').eq('user_id', userId).eq('contact_phone', senderNumber).single()

                    if (!conversation) {
                        const { data: newC } = await supabase.from('conversations').insert({
                            user_id: userId, contact_phone: senderNumber, contact_name: contactName,
                            last_message: messageContent, last_message_at: new Date().toISOString(), unread_count: 1
                        }).select().single()
                        conversation = newC
                    } else {
                        await supabase.from('conversations').update({
                            last_message: messageContent, last_message_at: new Date().toISOString(),
                            unread_count: (conversation.unread_count || 0) + 1
                        }).eq('id', conversation.id)
                    }

                    await supabase.from('messages').insert({
                        conversation_id: conversation.id, contact_phone: senderNumber,
                        content: messageContent, direction: 'inbound', status: 'received'
                    })

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
                        } catch (e) { }
                    }
                } catch (e) { }
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

app.get('/status/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId
    res.json({
        status: connectionStatus.get(userId) || 'disconnected',
        method: preferredMethod.get(userId) || 'qr',
        qrCode: qrCodes.get(userId),
        pairingCode: pairingCodes.get(userId),
        phoneNumber: activeSockets.get(userId)?.user?.id.split(':')[0]
    })
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
