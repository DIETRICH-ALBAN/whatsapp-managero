import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
    startWhatsAppSession,
    getWhatsAppStatus,
    disconnectWhatsApp
} from '@/lib/whatsapp/service'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('[Vercel API] Erreur auth:', authError)
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        console.log(`[Vercel API] Tentative de connexion WhatsApp pour: ${user.id}`)
        const result = await startWhatsAppSession(user.id)

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('[Vercel API] Erreur fatale POST /connect:', error.message)
        // On renvoie l'erreur précise au frontend pour le debug
        return NextResponse.json({
            error: 'Erreur service',
            details: error.message
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

        const status = await getWhatsAppStatus(user.id)
        return NextResponse.json(status)
    } catch (error: any) {
        console.error('[Vercel API] Erreur GET /status:', error.message)
        return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

        await disconnectWhatsApp(user.id)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
