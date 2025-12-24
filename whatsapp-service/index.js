/**
 * VIBE Agent - WhatsApp Service
 * Microservice autonome pour gérer les connexions WhatsApp via Baileys (Format ESM)
 * Déployable sur Railway, Render, ou tout VPS
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration de __dirname pour ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const PORT = process.env.PORT || 3001
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const API_SECRET = process.env.API_SECRET || 'dev-secret'

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables SUPABASE_URL et SUPABASE_SERVICE_KEY requises')
    process.exit(1)
}

// Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const logger = pino({ level: 'info' })
const app = express()

app.use(cors())
app.use(express.json())

// Store en mémoire pour les sessions actives
const activeSockets = new Map()
const qrCodes = new Map()
const connectionStatus = new Map()

// Middleware d'authentification simple
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['x-api-secret']
    if (authHeader !== API_SECRET) {
        return res.status(401).json({ error: 'Non autorisé' })
    }
    next()
}

// Créer le dossier pour les sessions si nécessaire
const sessionsDir = path.join(__dirname, 'sessions')
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true })
}

/**
 * Démarre une connexion WhatsApp pour un utilisateur
 */
async function startWhatsAppSession(userId) {
    try {
        // Vérifier si déjà connecté
        const existingSocket = activeSockets.get(userId)
        if (existingSocket?.user) {
            return {
                status: 'connected',
                phoneNumber: existingSocket.user.id.split(':')[0]
            }
        }

        // Si en cours de connexion, retourner le QR existant
        if (connectionStatus.get(userId) === 'connecting' && qrCodes.has(userId)) {
            return {
                status: 'connecting',
                qrCode: qrCodes.get(userId)
            }
        }

        connectionStatus.set(userId, 'connecting')
        logger.info({ userId }, 'Démarrage session WhatsApp')

        // Charger l'état d'authentification
        const sessionPath = path.join(sessionsDir, userId)
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        const { version } = await fetchLatestBaileysVersion()

        // Créer le socket WhatsApp
        const socket = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            logger: pino({ level: 'silent' }),
            browser: ['VIBE Agent', 'Chrome', '120.0.0']
        })

        activeSockets.set(userId, socket)

        // Gérer les événements de connexion
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                const qrDataUrl = await QRCode.toDataURL(qr)
                qrCodes.set(userId, qrDataUrl)
                logger.info({ userId }, 'QR code généré')
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output?.statusCode
                    : lastDisconnect?.error?.output?.statusCode

                const shouldReconnect = statusCode !== DisconnectReason.loggedOut

                logger.info({ userId, statusCode, shouldReconnect }, 'Connexion fermée')

                connectionStatus.set(userId, 'disconnected')
                qrCodes.delete(userId)
                activeSockets.delete(userId)

                // Mettre à jour Supabase
                await supabase
                    .from('whatsapp_sessions')
                    .update({ is_connected: false })
                    .eq('user_id', userId)

                if (shouldReconnect) {
                    setTimeout(() => startWhatsAppSession(userId), 5000)
                }
            }

            if (connection === 'open') {
                logger.info({ userId }, 'Connexion établie !')
                connectionStatus.set(userId, 'connected')
                qrCodes.delete(userId)

                const phoneNumber = socket.user?.id.split(':')[0] || null

                // Sauvegarder dans Supabase
                await supabase
                    .from('whatsapp_sessions')
                    .upsert({
                        user_id: userId,
                        phone_number: phoneNumber,
                        is_connected: true,
                        last_connected_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })
            }
        })

        // Sauvegarder les credentials quand ils changent
        socket.ev.on('creds.update', saveCreds)

        // Gérer les messages entrants
        socket.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0]
            if (!msg.key.fromMe && m.type === 'notify') {
                const senderPhone = (msg.key.remoteJid || '').split('@')[0] || ''
                const messageContent = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    '[Media]'

                logger.info({ userId, from: senderPhone, content: messageContent }, 'Message reçu')

                // Stocker le message dans Supabase (optionnel ici, l'app principale peut aussi le faire)
                try {
                    await supabase.from('messages').insert({
                        user_id: userId,
                        contact_phone: senderPhone,
                        content: messageContent,
                        direction: 'inbound',
                        status: 'received',
                        platform: 'whatsapp'
                    })
                } catch (e) {
                    logger.error({ error: e.message }, 'Erreur backup message Supabase')
                }
            }
        })

        // Attendre la génération du QR
        await new Promise(resolve => setTimeout(resolve, 3000))

        return {
            status: 'connecting',
            qrCode: qrCodes.get(userId),
            message: qrCodes.has(userId) ? 'Scannez le QR code' : 'Génération en cours...'
        }

    } catch (error) {
        logger.error({ userId, error: error.message }, 'Erreur démarrage session')
        connectionStatus.set(userId, 'disconnected')
        return { status: 'error', message: error.message }
    }
}

// ============ ROUTES API ============

// Health check
app.get('/', (req, res) => {
    res.json({
        service: 'VIBE WhatsApp Service',
        status: 'running',
        activeSessions: activeSockets.size
    })
})

// Démarrer une connexion
app.post('/connect/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const result = await startWhatsAppSession(userId)
    res.json(result)
})

// Récupérer le statut
app.get('/status/:userId', authMiddleware, (req, res) => {
    const { userId } = req.params
    const status = connectionStatus.get(userId) || 'disconnected'
    const qrCode = qrCodes.get(userId)
    const socket = activeSockets.get(userId)

    res.json({
        status,
        qrCode: status === 'connecting' ? qrCode : undefined,
        phoneNumber: socket?.user?.id.split(':')[0]
    })
})

// Déconnecter
app.delete('/disconnect/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const socket = activeSockets.get(userId)

    if (socket) {
        try {
            await socket.logout()
        } catch (e) {
            logger.warn({ userId, error: e.message }, 'Erreur logout')
        }
        activeSockets.delete(userId)
    }

    qrCodes.delete(userId)
    connectionStatus.set(userId, 'disconnected')

    await supabase
        .from('whatsapp_sessions')
        .update({ is_connected: false })
        .eq('user_id', userId)

    res.json({ success: true })
})

// Envoyer un message
app.post('/send/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const { phoneNumber, message } = req.body

    const socket = activeSockets.get(userId)
    if (!socket || connectionStatus.get(userId) !== 'connected') {
        return res.status(400).json({ error: 'WhatsApp non connecté' })
    }

    try {
        const jid = `${phoneNumber}@s.whatsapp.net`
        await socket.sendMessage(jid, { text: message })

        // Stocker le message sortant
        try {
            await supabase.from('messages').insert({
                user_id: userId,
                contact_phone: phoneNumber,
                content: message,
                direction: 'outbound',
                status: 'sent',
                platform: 'whatsapp'
            })
        } catch (e) {
            logger.error({ error: e.message }, 'Erreur backup message Supabase')
        }

        res.json({ success: true })
    } catch (error) {
        logger.error({ userId, error: error.message }, 'Erreur envoi message')
        res.status(500).json({ error: 'Erreur envoi' })
    }
})

// Démarrer le serveur
app.listen(PORT, () => {
    logger.info({ port: PORT }, '🚀 WhatsApp Service démarré')
})
