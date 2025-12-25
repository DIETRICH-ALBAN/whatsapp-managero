import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/service'

/**
 * POST - Envoie un message WhatsApp
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { phoneNumber, message, conversationId } = body

        if (!phoneNumber || !message) {
            return NextResponse.json({ error: 'Numéro et message requis' }, { status: 400 })
        }

        console.log(`[API Send] Envoi vers ${phoneNumber}: ${message.substring(0, 50)}...`)

        // Envoyer via le microservice Railway
        const result = await sendWhatsAppMessage(user.id, phoneNumber, message)

        // Enregistrer le message sortant dans Supabase
        if (conversationId) {
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                contact_phone: phoneNumber,
                content: message,
                direction: 'outbound',
                status: 'sent'
            })

            // Mettre à jour la conversation
            await supabase
                .from('conversations')
                .update({
                    last_message: message,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', conversationId)
        }

        return NextResponse.json({ success: true, result })

    } catch (error: any) {
        console.error('[API Send] Erreur:', error.message)
        return NextResponse.json({
            error: 'Erreur envoi message',
            details: error.message
        }, { status: 500 })
    }
}
