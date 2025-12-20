import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

// 1. VERIFICATION DU WEBHOOK (GET)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED')
        return new NextResponse(challenge, { status: 200 })
    } else {
        return new NextResponse('Forbidden', { status: 403 })
    }
}

// 2. RECEPTION DES MESSAGES (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Vérifier si c'est un événement WhatsApp valide
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0]
            const changes = entry?.changes?.[0]
            const value = changes?.value
            const messages = value?.messages

            if (messages && messages.length > 0) {
                const msg = messages[0]
                const contact = value?.contacts?.[0]

                // Extraire les infos
                const from = msg.from // Numéro de téléphone
                const name = contact?.profile?.name || from
                const text = msg.text?.body || '[Média non supporté]'
                const whatsappMsgId = msg.id

                console.log(`📩 Nouveau message de ${name} (${from}): ${text}`)

                // 1. GESTION DE LA CONVERSATION (Upsert)
                // On vérifie si une conversation existe déjà pour ce numéro
                const { data: existingConvo, error: searchError } = await supabaseAdmin
                    .from('conversations')
                    .select('id, unread_count')
                    .eq('contact_phone', from)
                    .single()

                let conversation_id

                if (existingConvo) {
                    // Update existante
                    conversation_id = existingConvo.id
                    await supabaseAdmin
                        .from('conversations')
                        .update({
                            last_message: text,
                            last_message_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            unread_count: (existingConvo.unread_count || 0) + 1,
                            contact_name: name // Mise à jour du nom si changé sur WhatsApp
                        })
                        .eq('id', conversation_id)
                } else {
                    // Nouvelle conversation
                    const { data: newConvo, error: createError } = await supabaseAdmin
                        .from('conversations')
                        .insert({
                            contact_phone: from,
                            contact_name: name,
                            last_message: text,
                            last_message_at: new Date().toISOString(),
                            unread_count: 1,
                            status: 'active'
                        })
                        .select()
                        .single()

                    if (createError) {
                        console.error('Erreur création conversation:', createError)
                        // Fallback: On continue sans ID de conversation si erreur (ne devrait pas arriver si SQL appliqué)
                    } else {
                        conversation_id = newConvo.id
                    }
                }

                // 2. INSERTION DU MESSAGE
                const { error } = await supabaseAdmin
                    .from('messages')
                    .insert({
                        contact_phone: from,
                        contact_name: name,
                        content: text,
                        direction: 'inbound',
                        status: 'new',
                        platform: 'whatsapp',
                        conversation_id: conversation_id // Lien avec la conversation
                    })

                if (error) {
                    console.error('Erreur sauvegarde Supabase:', error)
                    return new NextResponse('Internal Server Error', { status: 500 })
                }
            }

            return new NextResponse('EVENT_RECEIVED', { status: 200 })
        }

        return new NextResponse('Not found', { status: 404 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
