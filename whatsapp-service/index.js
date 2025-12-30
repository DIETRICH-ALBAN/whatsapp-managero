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
const sessionStartTimes = new Map() // Stocke le timestamp de connexion réussi

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

// Fonction pour restaurer les sessions actives au redémarrage
async function restoreSessions() {
    console.log('[Restore] Vérification des sessions à restaurer...')
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const { data: sessions } = await supabase.from('whatsapp_sessions').select('user_id, is_connected').eq('is_connected', true)

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
// Démarrer la restauration après un court délai
setTimeout(restoreSessions, 5000)

async function startSession(userId, phoneNumber = null) {
    const isCodeMode = !!phoneNumber
    preferredMethod.set(userId, isCodeMode ? 'code' : 'qr')

    // Reset immédiat des états d'affichage
    qrCodes.delete(userId)
    pairingCodes.delete(userId)
    pairingCodeRequested.delete(userId)

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
            // Signature recommandée pour le Pairing Code
            browser: ['Ubuntu', 'Chrome', '110.0.5481.100'],
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
                    // SOLUTION IA : Délai de 5s + Verrouillage anti-boucle
                    if (!pairingCodeRequested.get(userId)) {
                        pairingCodeRequested.set(userId, true)
                        console.log(`[Pairing] Signal QR reçu. Attente de 5s pour stabilisation socket...`)

                        setTimeout(async () => {
                            try {
                                console.log(`[Pairing] Envoi demande pour ${phone}...`)
                                const code = await socket.requestPairingCode(phone)
                                console.log(`[Pairing] SUCCÈS Code: ${code}`)
                                pairingCodes.set(userId, code)
                                qrCodes.delete(userId)
                                pendingPairing.delete(userId)
                            } catch (err) {
                                console.error(`[Pairing] Échec après 5s:`, err.message)
                                pairingCodes.set(userId, "ERREUR")
                                pairingCodeRequested.set(userId, false) // Permettre retry
                            }
                        }, 5000)
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
                sessionStartTimes.set(userId, new Date().toISOString()) // Fix timer reset
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
                try {
                    if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                    const jid = msg.key.remoteJid
                    const senderNumber = jid.split('@')[0]
                    const contactName = msg.pushName || senderNumber

                    // Détection du type de message
                    let messageContent = null
                    let messageType = 'text'
                    let mediaUrl = null

                    if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
                        messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text
                        messageType = 'text'
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

                    // Téléchargement et upload du média si applicable
                    if (['image', 'video', 'audio', 'document'].includes(messageType)) {
                        try {
                            const buffer = await downloadMediaMessage(msg, 'buffer', {})
                            const ext = messageType === 'image' ? 'jpg' : messageType === 'video' ? 'mp4' : messageType === 'audio' ? 'ogg' : 'bin'
                            const fileName = `${userId}/${Date.now()}_${senderNumber}.${ext}`

                            const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('whatsapp-media')
                                .upload(fileName, buffer, { contentType: `${messageType}/*`, upsert: true })

                            if (!uploadError && uploadData) {
                                const { data: publicUrl } = supabase.storage.from('whatsapp-media').getPublicUrl(fileName)
                                mediaUrl = publicUrl.publicUrl
                                console.log(`[Media] Uploaded: ${mediaUrl}`)
                            }
                        } catch (mediaErr) {
                            console.error(`[Media] Download/Upload error:`, mediaErr.message)
                        }
                    }

                    // Détection Groupe vs Contact
                    let finalContactName = contactName
                    if (jid.endsWith('@g.us')) {
                        try {
                            const groupMetadata = await socket.groupMetadata(jid)
                            finalContactName = groupMetadata.subject || 'Groupe WhatsApp'
                        } catch (gErr) {
                            console.log(`[Group] Impossible de récupérer le nom du groupe ${jid}`)
                            finalContactName = 'Groupe'
                        }
                    }

                    try {
                        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatsapp-managero.vercel.app'

                        let { data: conversation } = await supabase.from('conversations')
                            .select('*').eq('user_id', userId).eq('contact_phone', senderNumber).single()

                        if (!conversation) {
                            console.log(`[MSG] Nouvelle conversation: ${senderNumber} -> ${finalContactName}`)
                            const { data: newC, error: convError } = await supabase.from('conversations').insert({
                                user_id: userId,
                                contact_phone: senderNumber,
                                contact_name: finalContactName,
                                last_message: messageContent,
                                last_message_at: new Date().toISOString(),
                                unread_count: 1
                            }).select().single()
                            if (convError) {
                                console.error('[MSG] Erreur création conversation:', convError)
                            }
                            conversation = newC
                        } else {
                            // Mise à jour : on met à jour le nom aussi si on l'a (pour corriger les anciens numéros)
                            const updateData = {
                                last_message: messageContent,
                                last_message_at: new Date().toISOString(),
                                unread_count: (conversation.unread_count || 0) + 1
                            }
                            // Si le nom a changé ou était un numéro, on le met à jour
                            if (finalContactName && finalContactName !== senderNumber) {
                                updateData.contact_name = finalContactName
                            }

                            await supabase.from('conversations').update(updateData).eq('id', conversation.id)
                        }

                        console.log(`[MSG] Insertion message: ${messageContent.substring(0, 30)}...`)

                        // Insertion sans les colonnes optionnelles pour compatibilité
                        const msgPayload = {
                            conversation_id: conversation.id,
                            contact_phone: senderNumber,
                            content: messageContent,
                            direction: 'inbound',
                            status: 'received'
                        }
                        // Ajouter les colonnes optionnelles seulement si elles ont une valeur
                        if (messageType && messageType !== 'text') msgPayload.message_type = messageType
                        if (mediaUrl) msgPayload.media_url = mediaUrl

                        const { error: msgError } = await supabase.from('messages').insert(msgPayload)
                        if (msgError) {
                            console.error('[MSG] Erreur insertion message:', msgError)
                        } else {
                            console.log('[MSG] Message inséré avec succès!')
                        }

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
                            } catch (aiErr) {
                                console.error('[AI] Erreur réponse IA:', aiErr)
                            }
                        }
                    } catch (dbErr) {
                        console.error('[DB] Erreur base de données:', dbErr)
                    }
                } catch (msgErr) {
                    console.error('[Error processing message]', msgErr)
                }
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
        phoneNumber: activeSockets.get(userId)?.user?.id.split(':')[0],
        sessionStartTime: sessionStartTimes.get(userId) // Ajout pour le frontend
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
