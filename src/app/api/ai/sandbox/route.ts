import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateAIResponse } from '@/lib/ai/service'

/**
 * POST - Mode Sandbox pour tester l'agent sans créer de vraies données
 * Body: { messages: [{role, content}], systemPrompt?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { messages, systemPrompt } = body

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
        }

        // Si pas de systemPrompt fourni, on récupère celui de l'agent
        let finalSystemPrompt = systemPrompt

        if (!finalSystemPrompt) {
            const { data: agentConfig } = await supabase
                .from('agent_configs')
                .select('system_prompt, model')
                .eq('user_id', user.id)
                .single()

            finalSystemPrompt = agentConfig?.system_prompt ||
                "Tu es un assistant commercial utile et courtois."
        }

        // Construire les messages pour l'IA
        const aiMessages = [
            { role: 'system', content: finalSystemPrompt },
            ...messages
        ]

        console.log(`[AI Sandbox] Test avec ${messages.length} messages`)

        // Générer la réponse
        const aiResponse = await generateAIResponse(aiMessages)

        return NextResponse.json({
            response: aiResponse
        })

    } catch (error: any) {
        console.error('[AI Sandbox] Erreur:', error.message)
        return NextResponse.json({
            error: 'Erreur génération IA',
            details: error.message
        }, { status: 500 })
    }
}
