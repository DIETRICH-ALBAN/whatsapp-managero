/**
 * API Route: Connexion WhatsApp
 * Démarre la session et renvoie le statut
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { startWhatsAppSession, getSessionStatus, disconnectSession } from '@/lib/whatsapp/baileys'

// POST: Démarrer une session
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

// GET: Récupérer le statut actuel
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const session = getSessionStatus(user.id)

        if (!session) {
            // Vérifier en BDD si une session existe
            const { data } = await supabase
                .from('whatsapp_sessions')
                .select('is_connected, phone_number, last_connected_at')
                .eq('user_id', user.id)
                .single()

            return NextResponse.json({
                status: 'disconnected',
                savedSession: data ? {
                    wasConnected: data.is_connected,
                    phoneNumber: data.phone_number,
                    lastConnected: data.last_connected_at
                } : null
            })
        }

        return NextResponse.json({
            status: session.status,
            qrCode: session.qrCode,
            phoneNumber: session.phoneNumber
        })

    } catch (error) {
        console.error('Erreur statut WhatsApp:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

// DELETE: Déconnecter la session
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        await disconnectSession(user.id)
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Erreur déconnexion WhatsApp:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
