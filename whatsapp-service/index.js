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

const authMiddleware = (req, res, next) => {
    if (req.headers['x-api-secret'] !== API_SECRET) {
        return res.status(401).json({ error: 'Non autorisé' })
    }
    next()
}

app.get('/', (req, res) => res.json({ status: 'online', service: 'VIBE WhatsApp' }))

async function startSession(userId) {
    if (activeSockets.has(userId)) {
        console.log(`[Session] Déjà active pour ${userId}`)
        return {
            status: connectionStatus.get(userId) || 'connecting',
            qrCode: qrCodes.get(userId)
        }
    }

    try {
        console.log(`[Session] Démarrage pour ${userId}`)
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
            logger: pino({ level: 'info' }), // Un peu plus de logs pour le debug
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
                console.log(`[QR] Nouveau code pour ${userId}`)
                const qrData = await QRCode.toDataURL(qr)
                qrCodes.set(userId, qrData)
            }

            if (connection === 'open') {
                console.log(`[Connexion] Succès pour ${userId}`)
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

        socket.ev.on('creds.update', async () => {
            await saveCreds()
            // Sauvegarder également dans Supabase pour la persistance cloud
            try {
                const credsContent = fs.readFileSync(path.join(sessionPath, 'creds.json'), 'utf-8')
                await supabase.from('whatsapp_sessions').upsert({
                    user_id: userId,
                    creds: credsContent,
                    updated_at: new Date().toISOString()
                })
                console.log(`[Session] Creds sauvegardés sur Supabase pour ${userId}`)
            } catch (err) {
                console.error(`[Session] Erreur sauvegarde Supabase:`, err.message)
            }
        })

        // === ÉCOUTE DES MESSAGES ENTRANTS ===
        socket.ev.on('messages.upsert', async (m) => {
            const messages = m.messages
            for (const msg of messages) {
                // Ignorer les messages de statut et les messages envoyés par nous
                if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue

                const jid = msg.key.remoteJid
                const isGroup = jid.endsWith('@g.us')
                const senderNumber = jid.split('@')[0]
                const participant = msg.key.participant ? msg.key.participant.split('@')[0] : senderNumber

                // Pour un groupe, on veut peut-être afficher "Nom du Groupe" au lieu du numéro
                let contactName = msg.pushName || senderNumber
                if (isGroup) {
                    // On pourrait essayer de récupérer le nom du groupe, mais Baileys le donne dans un autre event
                    // Pour l'instant on garde l'ID ou on marque "Groupe"
                    contactName = `Groupe: ${senderNumber.substring(0, 10)}...`
                }

                let messageContent = ''
                let messageType = 'text'

                // Extraction du texte... (code existant)
                if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
                    messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text
                    messageType = 'text'
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
                    // 1. Trouver ou créer la conversation
                    let { data: conversation } = await supabase
                        .from('conversations')
                        .select('id, contact_name')
                        .eq('user_id', userId)
                        .eq('contact_phone', senderNumber)
                        .single()

                    if (!conversation) {
                        const { data: newConvo } = await supabase
                            .from('conversations')
                            .insert({
                                user_id: userId,
                                contact_phone: senderNumber,
                                contact_name: contactName,
                                last_message: messageContent,
                                unread_count: 1
                            })
                            .select('id')
                            .single()
                        conversation = newConvo
                    } else {
                        // Mettre à jour la conversation
                        await supabase
                            .from('conversations')
                            .update({
                                contact_name: conversation.contact_name || contactName,
                                last_message: messageContent,
                                last_message_at: new Date().toISOString(),
                                unread_count: (conversation.unread_count || 0) + 1
                            })
                            .eq('id', conversation.id)
                    }

                    // 2. Enregistrer le message
                    await supabase.from('messages').insert({
                        conversation_id: conversation.id,
                        contact_phone: isGroup ? participant : senderNumber,
                        content: messageContent,
                        message_type: messageType,
                        direction: 'inbound',
                        status: 'received'
                    })

                    // === AUTOMATISATION IA (UNIQUEMENT PRIVÉ) ===
                    // 3. Vérifier si l'IA est activée pour cet utilisateur
                    const { data: agentConfig } = await supabase
                        .from('agent_configs')
                        .select('*')
                        .eq('user_id', userId)
                        .single()

                    if (!isGroup && agentConfig?.is_active && messageType === 'text') {
                        console.log(`[IA] Agent actif pour ${userId}. Génération de réponse...`)

                        // Appeler l'API Vercel pour générer la réponse (on utilise fetch)
                        // Note: On pourrait aussi le faire en local mais passer par Vercel centralise le cerveau
                        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatsapp-managero.vercel.app'

                        try {
                            // On simule un délai de "frappe" pour faire plus humain
                            await new Promise(resolve => setTimeout(resolve, 2000))

                            const aiResponse = await fetch(`${SITE_URL}/api/ai/chat`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-api-secret': API_SECRET // Sécurité pour éviter les appels externes
                                },
                                body: JSON.stringify({
                                    conversationId: conversation.id,
                                    message: messageContent
                                })
                            })

                            const aiData = await aiResponse.json()

                            if (aiData.response) {
                                // Envoyer la réponse sur WhatsApp
                                await socket.sendMessage(jid, { text: aiData.response })
                                console.log(`[IA] Réponse envoyée à ${senderNumber}`)

                                // Enregistrer la réponse de l'IA dans Supabase
                                await supabase.from('messages').insert({
                                    conversation_id: conversation.id,
                                    contact_phone: senderNumber,
                                    content: aiData.response,
                                    direction: 'outbound',
                                    status: 'sent',
                                    is_ai_generated: true
                                })

                                // Mettre à jour la conversation
                                await supabase.from('conversations').update({
                                    last_message: aiData.response,
                                    last_message_at: new Date().toISOString()
                                }).eq('id', conversation.id)
                            }
                        } catch (aiErr) {
                            console.error(`[IA] Erreur génération:`, aiErr.message)
                        }
                    }

                } catch (dbError) {
                    console.error(`[Message] Erreur DB:`, dbError.message)
                }
            }
        })

        return { status: 'connecting' }
    } catch (e) {
        console.error(`[CRASH] ${userId}:`, e.message)
        return { status: 'error', message: e.message }
    }
}

app.post('/connect/:userId', authMiddleware, async (req, res) => res.json(await startSession(req.params.userId)))
app.get('/status/:userId', authMiddleware, (req, res) => {
    res.json({
        status: connectionStatus.get(req.params.userId) || 'disconnected',
        qrCode: qrCodes.get(req.params.userId),
        phoneNumber: activeSockets.get(req.params.userId)?.user?.id.split(':')[0]
    })
})

app.get('/debug/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId
    res.json({
        hasSocket: activeSockets.has(userId),
        status: connectionStatus.get(userId),
        hasQr: !!qrCodes.get(userId),
        qrLength: qrCodes.get(userId)?.length || 0,
        sessionExists: fs.existsSync(path.join(__dirname, 'sessions', userId))
    })
})
app.delete('/disconnect/:userId', authMiddleware, async (req, res) => {
    const socket = activeSockets.get(req.params.userId)
    if (socket) {
        try { await socket.logout() } catch (e) { }
        activeSockets.delete(req.params.userId)
        connectionStatus.set(req.params.userId, 'disconnected')
    }
    res.json({ success: true })
})

// === ENVOI DE MESSAGES ===
app.post('/send/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params
    const { phoneNumber, message } = req.body

    const socket = activeSockets.get(userId)
    if (!socket) {
        return res.status(400).json({ error: 'WhatsApp non connecté' })
    }

    try {
        // Formater le numéro au format WhatsApp (ajouter @s.whatsapp.net)
        const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`

        await socket.sendMessage(jid, { text: message })
        console.log(`[Envoi] Message envoyé à ${phoneNumber}`)

        res.json({ success: true, message: 'Message envoyé' })
    } catch (error) {
        console.error(`[Envoi] Erreur:`, error.message)
        res.status(500).json({ error: 'Échec envoi', details: error.message })
    }
})

app.listen(PORT, HOST, () => console.log(`🚀 Microservice prêt sur ${PORT}`))
