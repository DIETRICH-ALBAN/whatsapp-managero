/**
 * VIBE Messaging Engine v2
 * Architecture simplifiée pour Railway + Supabase
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    initAuthCreds,
    BufferJSON
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import pino from 'pino'

const app = express()
app.use(cors())
app.use(express.json())

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const API_SECRET = process.env.API_SECRET || 'vibe_secret'
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Mémoire vive pour les sockets actifs
const activeSockets = new Map()
const sessionStates = new Map() // { status, qr, pairingCode }

/**
 * ADAPTATEUR DE SESSION ATOMIQUE
 * Sauvegarde tout le bloc d'un coup pour éviter de saturer Supabase
 */
const getAtomicAuth = async (userId) => {
    const { data } = await supabase.from('whatsapp_sessions').select('session_data').eq('user_id', userId).single()

    let state = { creds: initAuthCreds(), keys: {} }
    if (data?.session_data) {
        state = JSON.parse(data.session_data, BufferJSON.reviver)
    }

    const save = async () => {
        const payload = JSON.stringify(state, BufferJSON.replacer)
        await supabase.from('whatsapp_sessions').upsert({
            user_id: userId,
            session_data: payload,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
    }

    return {
        state: {
            creds: state.creds,
            keys: {
                get: (type, ids) => {
                    const res = {}
                    for (const id of ids) {
                        const key = `${type}-${id}`
                        if (state.keys[key]) res[id] = state.keys[key]
                    }
                    return res
                },
                set: (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const key = `${type}-${id}`
                            if (data[type][id]) state.keys[key] = data[type][id]
                            else delete state.keys[key]
                        }
                    }
                    save().catch(e => console.error('Save error', e.message))
                }
            }
        },
        saveCreds: save
    }
}

async function startEngine(userId, phone = null) {
    if (activeSockets.has(userId)) return

    console.log(`[Engine] Démarrage pour ${userId}...`)
    sessionStates.set(userId, { status: 'initializing' })

    const { state, saveCreds } = await getAtomicAuth(userId)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket.default({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['VibeVendor', 'Chrome', '110.0'],
        connectTimeoutMs: 60000
    })

    activeSockets.set(userId, sock)

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            if (phone) {
                // Mode Code Appareil
                const code = await sock.requestPairingCode(phone.replace(/\D/g, ''))
                sessionStates.set(userId, { status: 'pairing', pairingCode: code })
            } else {
                // Mode QR
                const qrData = await QRCode.toDataURL(qr)
                sessionStates.set(userId, { status: 'qr', qr: qrData })
            }
        }

        if (connection === 'open') {
            console.log(`[Engine] ${userId} CONNECTÉ ✅`)
            sessionStates.set(userId, { status: 'connected' })
            await supabase.from('whatsapp_sessions').update({
                is_connected: true,
                phone_number: sock.user.id.split(':')[0]
            }).eq('user_id', userId)
        }

        if (connection === 'close') {
            const code = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0
            console.log(`[Engine] Connexion fermée (${code})`)
            activeSockets.delete(userId)

            if (code === DisconnectReason.loggedOut || code === 401) {
                sessionStates.set(userId, { status: 'logged_out' })
                await supabase.from('whatsapp_sessions').delete().eq('user_id', userId)
            } else {
                sessionStates.set(userId, { status: 'disconnected' })
                setTimeout(() => startEngine(userId), 5000)
            }
        }
    })
}

// RESTAURATION AU DÉMARRAGE
const restore = async () => {
    const { data } = await supabase.from('whatsapp_sessions').select('user_id').eq('is_connected', true)
    data?.forEach(s => startEngine(s.user_id))
}
setTimeout(restore, 5000)

// API ROUTES
app.post('/connect/:userId', async (req, res) => {
    startEngine(req.params.userId, req.body.phoneNumber)
    res.json({ success: true })
})

app.get('/status/:userId', (req, res) => {
    const state = sessionStates.get(req.params.userId) || { status: 'disconnected' }
    res.json(state)
})

app.delete('/disconnect/:userId', async (req, res) => {
    const sock = activeSockets.get(req.params.userId)
    if (sock) {
        await sock.logout()
        activeSockets.delete(req.params.userId)
    }
    res.json({ success: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Engine v2 lancé sur ${PORT}`))
