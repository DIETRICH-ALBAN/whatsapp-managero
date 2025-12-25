/**
 * VIBE Agent - WhatsApp Service (Optimisé)
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pkgBaileys from '@whiskeysockets/baileys'
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = pkgBaileys

import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const API_SECRET = process.env.API_SECRET || 'vibe_vendor_secure_2024'

const app = express()
app.use(cors())
app.use(express.json())

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
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const sessionPath = path.join(__dirname, 'sessions', userId)
        if (!fs.existsSync(path.join(__dirname, 'sessions'))) fs.mkdirSync(path.join(__dirname, 'sessions'))

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        const { version } = await fetchLatestBaileysVersion()

        const socket = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            browser: ['VIBE Agent', 'Chrome', '120.0.0'],
            logger: pino({ level: 'silent' })
        })

        activeSockets.set(userId, socket)
        connectionStatus.set(userId, 'connecting')

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) qrCodes.set(userId, await QRCode.toDataURL(qr))

            if (connection === 'open') {
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

        return { status: 'connecting', message: 'Démarrage en cours...' }
    } catch (e) {
        return { status: 'error', message: e.message }
    }
}

app.post('/connect/:userId', authMiddleware, async (req, res) => {
    const result = await startSession(req.params.userId)
    res.json(result)
})

app.get('/status/:userId', authMiddleware, (req, res) => {
    res.json({
        status: connectionStatus.get(req.params.userId) || 'disconnected',
        qrCode: qrCodes.get(req.params.userId),
        phoneNumber: activeSockets.get(req.params.userId)?.user?.id.split(':')[0]
    })
})

app.delete('/disconnect/:userId', authMiddleware, async (req, res) => {
    const socket = activeSockets.get(req.params.userId)
    if (socket) await socket.logout()
    activeSockets.delete(req.params.userId)
    res.json({ success: true })
})

app.listen(PORT, HOST, () => console.log(`🚀 Microservice prêt sur ${PORT}`))
