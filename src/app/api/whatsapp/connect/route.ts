import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
    startWhatsAppSession,
    getWhatsAppStatus,
    disconnectWhatsApp
} from '@/lib/whatsapp/service'

/**
 * POST - Démarre une connexion WhatsApp (génère le QR code)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const result = await startWhatsAppSession(user.id)
        return NextResponse.json(result)

    } catch (error) {
        console.error('Erreur connexion WhatsApp:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

/**
 * GET - Récupère le statut de connexion WhatsApp
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const status = await getWhatsAppStatus(user.id)
        return NextResponse.json(status)

    } catch (error) {
        console.error('Erreur statut WhatsApp:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

/**
 * DELETE - Déconnecte WhatsApp
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        await disconnectWhatsApp(user.id)
        return NextResponse.json({ success: true, message: 'Déconnecté' })

    } catch (error) {
        console.error('Erreur déconnexion WhatsApp:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
