import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateAIResponse } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const authHeader = request.headers.get('x-api-secret')
        let userId: string | null = null

        // 1. Authentification soit par session, soit par API SECRET
        if (authHeader && authHeader === process.env.WHATSAPP_SERVICE_SECRET) {
            // Appel interne depuis le microservice Railway
            // Dans ce cas, on doit passer le userId dans le body car on n'a pas de session
            const bodyPeek = await request.clone().json()
            // On va chercher le userId associé à la conversation
            const { data: conv } = await supabase
                .from('conversations')
                .select('user_id')
                .eq('id', bodyPeek.conversationId)
                .single()
            userId = conv?.user_id
        } else {
            // Appel depuis le frontend (session utilisateur)
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (!authError && user) {
                userId = user.id
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, message, agentId } = body

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID requis' }, { status: 400 })
        }

        // 1. Récupérer la config de l'agent (spécifique ou par défaut)
        let agentConfig = null
        if (agentId) {
            const { data } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('id', agentId)
                .eq('user_id', userId) // Sécurité : l'agent doit appartenir à l'user
                .single()
            agentConfig = data
        }

        if (!agentConfig) {
            const { data } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', userId)
                .eq('is_default', true)
                .single()
            agentConfig = data
        }

        // Si toujours rien, on essaye de prendre le premier disponible
        if (!agentConfig) {
            const { data } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle()
            agentConfig = data
        }

        // Config par défaut si vraiment rien en DB
        const systemPrompt = agentConfig?.system_prompt ||
            "Tu es un assistant virtuel utile et professionnel. Tu aides le client en répondant brièvement et poliment."
        const model = agentConfig?.model || 'openai/gpt-4o-mini'

        // 2. Récupérer l'historique récent (10 derniers messages)
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
