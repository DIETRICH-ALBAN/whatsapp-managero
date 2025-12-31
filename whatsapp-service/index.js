/**
 * VIBE Engine v3 - Ultra-Stable
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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const activeSockets = new Map()
const sessionStates = new Map()

const getAuth = async (userId) => {
    const { data } = await supabase.from('whatsapp_sessions').select('session_data').eq('user_id', userId).single()
    let state = { creds: initAuthCreds(), keys: {} }
    if (data?.session_data) state = JSON.parse(data.session_data, BufferJSON.reviver)

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
                    save().catch(() => { })
                }
            }
        },
        saveCreds: save
    }
}

async function start(userId, phone = null) {
    if (activeSockets.has(userId)) return
    sessionStates.set(userId, { status: 'initializing' })

    try {
        const { state, saveCreds } = await getAuth(userId)
        const { version } = await fetchLatestBaileysVersion()

        const sock = (makeWASocket.default || makeWASocket)({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['VibeVendor', 'Chrome', '110.0'],
            syncFullHistory: false
        })

        activeSockets.set(userId, sock)

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            if (qr) {
                if (phone) {
                    const code = await sock.requestPairingCode(phone.replace(/\D/g, ''))
                    sessionStates.set(userId, { status: 'pairing', pairingCode: code })
                } else {
                    sessionStates.set(userId, { status: 'qr', qr: await QRCode.toDataURL(qr) })
                }
            }
            if (connection === 'open') {
                sessionStates.set(userId, { status: 'connected' })
                await supabase.from('whatsapp_sessions').update({ is_connected: true }).eq('user_id', userId)
            }
            if (connection === 'close') {
                const code = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output?.statusCode : 0
                activeSockets.delete(userId)
                if (code === 401 || code === DisconnectReason.loggedOut) {
                    sessionStates.set(userId, { status: 'logged_out' })
                    await supabase.from('whatsapp_sessions').delete().eq('user_id', userId)
                } else {
                    sessionStates.set(userId, { status: 'disconnected' })
                    setTimeout(() => start(userId), 5000)
                }
            }
        })
    } catch (e) {
        sessionStates.set(userId, { status: 'error', message: e.message })
    }
}

app.post('/connect/:userId', (req, res) => {
    start(req.params.userId, req.body.phoneNumber)
    res.json({ success: true })
})

app.get('/status/:userId', (req, res) => {
    res.json(sessionStates.get(req.params.userId) || { status: 'disconnected' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 v3 Ready on ${PORT}`))
