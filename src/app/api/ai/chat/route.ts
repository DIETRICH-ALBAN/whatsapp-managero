import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateAIResponse } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, message } = body

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID requis' }, { status: 400 })
        }

        // 1. Récupérer la config de l'agent
        const { data: agentConfig } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // Config par défaut si non trouvée
        const systemPrompt = agentConfig?.system_prompt ||
            "Tu es un assistant virtuel utile et professionnel. Tu aides le client en répondant brièvement et poliment."
        const model = agentConfig?.model || 'gpt-4o-mini'

        // 2. Récupérer l'historique récent (5 derniers messages)
        const { data: history } = await supabase
            .from('messages')
            .select('content, direction')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(10)

        // Inverser pour avoir l'ordre chronologique
        const formattedHistory = history?.reverse().map(msg => ({
            role: msg.direction === 'outbound' ? 'assistant' : 'user',
            content: msg.content
        })) || []

        // Ajouter le message actuel s'il n'est pas déjà dans l'historique (cas où on appelle l'API juste après réception)
        // Ici on suppose que le frontend envoie "message" comme dernier message utilisateur à traiter
        if (message) {
            formattedHistory.push({ role: 'user', content: message })
        }

        // 3. Construire les messages pour l'IA
        const aiMessages: any[] = [
            { role: 'system', content: systemPrompt },
            ...formattedHistory
        ]

        console.log(`[AI Chat] Génération pour conv ${conversationId} avec modèle ${model}`)

        // 4. Générer la réponse
        const aiResponse = await generateAIResponse(aiMessages, { model })

        return NextResponse.json({
            response: aiResponse,
            used_model: model
        })

    } catch (error: any) {
        console.error('[AI Chat] Erreur:', error.message)
        return NextResponse.json({
            error: 'Erreur génération IA',
            details: error.message
        }, { status: 500 })
    }
}
