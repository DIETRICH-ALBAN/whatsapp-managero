/**
 * VIBE Messaging Engine v2.1 (Stable & Lightweight)
 * Correctif pour crash 502 et synchronisation historique
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    initAuthCreds,
    BufferJSON,
    downloadMediaMessage
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

const activeSockets = new Map()
const sessionStates = new Map()

/**
 * ADAPTATEUR DE SESSION ATOMIQUE
 */
const getAtomicAuth = async (userId) => {
    const { data } = await supabase.from('whatsapp_sessions').select('session_data').eq('user_id', userId).single()

    let state = { creds: initAuthCreds(), keys: {} }
    if (data?.session_data) {
        try { state = JSON.parse(data.session_data, BufferJSON.reviver) } catch (e) { }
    }

    const save = async () => {
        try {
            const payload = JSON.stringify(state, BufferJSON.replacer)
            await supabase.from('whatsapp_sessions').upsert({
                user_id: userId,
                session_data: payload,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
        } catch (e) { console.error('[Auth] Save error:', e.message) }
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
                    save() // Async sans await pour ne pas bloquer
                }
            }
        },
        saveCreds: save
    }
}

async function startEngine(userId, phone = null) {
    if (activeSockets.has(userId)) return

    console.log(`[Engine] Initialisation ${userId}...`)
    sessionStates.set(userId, { status: 'initializing' })

    try {
        const { state, saveCreds } = await getAtomicAuth(userId)
        const { version } = await fetchLatestBaileysVersion()

        const sock = (makeWASocket.default || makeWASocket)({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['VibeVendor', 'Chrome', '110.0'],
            connectTimeoutMs: 60000,
            // OPTIMISATION RAILWAY : Désactiver la synchro d'historique pour éviter le crash mémoire
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            linkPreviewImageThumbnailConfig: { maxSide: 100 }
        })

        activeSockets.set(userId, sock)

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                if (phone) {
                    try {
                        const code = await sock.requestPairingCode(phone.replace(/\D/g, ''))
                        sessionStates.set(userId, { status: 'pairing', pairingCode: code })
                    } catch (e) {
                        console.error('[Engine] Pairing Error:', e.message)
                        sessionStates.set(userId, { status: 'error', message: e.message })
                    }
                } else {
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
                console.log(`[Engine] Déconnexion (${code})`)
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

        // RÉINTÉGRATION DE LA GESTION DES MESSAGES (OPTIMISÉE)
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify') return
            for (const msg of m.messages) {
                if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                const jid = msg.key.remoteJid
                const senderNumber = jid.split('@')[0]
                const contactName = msg.pushName || senderNumber

                let content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "[Média]"
                let type = 'text'
                let mediaUrl = null

                // Simplification media pour stabilité
                if (msg.message?.imageMessage) type = 'image'
                if (msg.message?.videoMessage) type = 'video'
                if (msg.message?.audioMessage) type = 'audio'

                const { data: conv } = await supabase.from('conversations')
                    .select('*').eq('user_id', userId).eq('contact_phone', senderNumber).single()

                let convId = conv?.id
                if (!conv) {
                    const { data: newC } = await supabase.from('conversations').insert({
                        user_id: userId, contact_phone: senderNumber, contact_name: contactName,
                        last_message: content, last_message_at: new Date().toISOString()
                    }).select().single()
                    convId = newC?.id
                } else {
                    await supabase.from('conversations').update({
                        last_message: content, last_message_at: new Date().toISOString(),
                        unread_count: (conv.unread_count || 0) + 1
                    }).eq('id', conv.id)
                }

                if (convId) {
                    await supabase.from('messages').insert({
                        conversation_id: convId, contact_phone: senderNumber,
                        content: content, direction: 'inbound', status: 'received',
                        message_type: type
                    })
                }
            }
        })

    } catch (err) {
        console.error('[Engine] Crash init:', err.message)
        sessionStates.set(userId, { status: 'error', message: err.message })
    }
}

// RESTORE
setTimeout(async () => {
    const { data } = await supabase.from('whatsapp_sessions').select('user_id').eq('is_connected', true)
    data?.forEach(s => startEngine(s.user_id))
}, 5000)

// API
app.post('/connect/:userId', (req, res) => {
    startEngine(req.params.userId, req.body.phoneNumber)
    res.json({ success: true })
})

app.get('/status/:userId', (req, res) => {
    res.json(sessionStates.get(req.params.userId) || { status: 'disconnected' })
})

app.post('/send/:userId', async (req, res) => {
    const sock = activeSockets.get(req.params.userId)
    if (!sock) return res.status(400).json({ error: 'Socket non actif' })
    try {
        await sock.sendMessage(`${req.body.phoneNumber}@s.whatsapp.net`, { text: req.body.message })
        res.json({ success: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Engine stable lancé sur ${PORT}`))
