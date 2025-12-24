/**
 * VIBE Agent - WhatsApp Service (ESM)
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- CONFIGURATION ---
// Railway injecte souvent PORT. Si on a mis 3000 dans l'UI, on force 3000.
const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const API_SECRET = process.env.API_SECRET || 'vibe_vendor_secure_2024'

console.log('--- DÉMARRAGE DU SERVICE ---')
console.log(`Port: ${PORT}`)
console.log(`Supabase URL présente: ${!!SUPABASE_URL}`)
console.log(`Supabase Key présente: ${!!SUPABASE_SERVICE_KEY}`)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ ERREUR: SUPABASE_URL ou SUPABASE_SERVICE_KEY manquante dans Railway !')
    // On ne fait pas exit(1) tout de suite pour laisser les logs apparaître
}

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null

const logger = pino({ level: 'info' })
const app = express()

app.use(cors())
app.use(express.json())

const activeSockets = new Map()
const qrCodes = new Map()
const connectionStatus = new Map()

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['x-api-secret']
    if (authHeader !== API_SECRET) {
        return res.status(401).json({ error: 'Non autorisé' })
    }
    next()
}

const sessionsDir = path.join(__dirname, 'sessions')
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true })

// Démarrage session
async function startWhatsAppSession(userId) {
    try {
        if (!supabase) throw new Error('Supabase non configuré')

        const existingSocket = activeSockets.get(userId)
        if (existingSocket?.user) {
            return { status: 'connected', phoneNumber: existingSocket.user.id.split(':')[0] }
        }

        connectionStatus.set(userId, 'connecting')
        const sessionPath = path.join(sessionsDir, userId)
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
        const { version } = await fetchLatestBaileysVersion()

        const socket = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ['VIBE Agent', 'Chrome', '120.0.0']
        })

        activeSockets.set(userId, socket)

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) {
                qrCodes.set(userId, await QRCode.toDataURL(qr))
            }
            if (connection === 'open') {
                connectionStatus.set(userId, 'connected')
                qrCodes.delete(userId)
                await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    phone_number: socket.user?.id.split(':')[0],
                    is_connected: true,
                    last_connected_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode
                if (statusCode !== DisconnectReason.loggedOut) {
                    setTimeout(() => startWhatsAppSession(userId), 5000)
                }
            }
        })

        socket.ev.on('creds.update', saveCreds)
        await new Promise(r => setTimeout(r, 3000))

        return {
            status: 'connecting',
            qrCode: qrCodes.get(userId),
            message: qrCodes.has(userId) ? 'Scannez le QR' : 'Génération...'
        }
    } catch (error) {
        return { status: 'error', message: error.message }
    }
}

// Routes
app.get('/', (req, res) => res.json({ status: 'online', port: PORT }))
app.post('/connect/:userId', authMiddleware, async (req, res) => res.json(await startWhatsAppSession(req.params.userId)))
app.get('/status/:userId', authMiddleware, (req, res) => {
    res.json({
        status: connectionStatus.get(req.params.userId) || 'disconnected',
        qrCode: qrCodes.get(req.params.userId),
        phoneNumber: activeSockets.get(req.params.userId)?.user?.id.split(':')[0]
    })
})

app.listen(PORT, HOST, () => {
    console.log(`🚀 SERVEUR PRÊT SUR http://${HOST}:${PORT}`)
})
