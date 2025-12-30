import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendWhatsAppMedia } from '@/lib/whatsapp/service'

/**
 * POST - Envoie un média WhatsApp
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { phoneNumber, mediaUrl, caption, type, conversationId } = body

        if (!phoneNumber || !mediaUrl) {
            return NextResponse.json({ error: 'Numéro et URL média requis' }, { status: 400 })
        }

        console.log(`[API SendMedia] Envoi vers ${phoneNumber}: ${type} ${mediaUrl}`)

        // Envoyer via le microservice Railway
        const result = await sendWhatsAppMedia(user.id, phoneNumber, mediaUrl, caption, type)

        // Enregistrer le message sortant dans Supabase
        if (conversationId) {
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                contact_phone: phoneNumber,
                content: caption || `Envoi de ${type}`,
                direction: 'outbound',
                status: 'sent',
                message_type: type,
                media_url: mediaUrl
            })

            // Mettre à jour la conversation
            await supabase
                .from('conversations')
                .update({
                    last_message: caption || `📷 ${type}`,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', conversationId)
        }

        return NextResponse.json({ success: true, result })

    } catch (error: any) {
        console.error('[API SendMedia] Erreur:', error.message)
        return NextResponse.json({
            error: 'Erreur envoi média',
            details: error.message
        }, { status: 500 })
    }
}
