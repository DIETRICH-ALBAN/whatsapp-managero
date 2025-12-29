import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { analyzeIntent } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('x-api-secret')
        if (authHeader !== process.env.WHATSAPP_SERVICE_SECRET) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const { message } = await request.json()
        if (!message) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

        const analysis = await analyzeIntent(message)

        return NextResponse.json(analysis)

    } catch (error: any) {
        console.error('[Analyze API] Error:', error.message)
        return NextResponse.json({ error: 'Failure', details: error.message }, { status: 500 })
    }
}
