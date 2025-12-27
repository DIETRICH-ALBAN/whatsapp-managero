import OpenAI from 'openai'

// On utilise une clé par défaut pour le développement si non définie
// Dans un vrai prod, on gérerait ça via des variables d'env sécurisées ou KMS
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // À supprimer si on passe full server-side
})

interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export async function generateAIResponse(
    messages: ChatMessage[],
    config: { model?: string; temperature?: number } = {}
) {
    try {
        const response = await openai.chat.completions.create({
            model: config.model || 'gpt-4o-mini',
            messages: messages,
            temperature: config.temperature || 0.7,
            max_tokens: 500,
        })

        return response.choices[0].message.content
    } catch (error: any) {
        console.error('[AI Service] Error:', error)
        throw new Error(`AI Generation failed: ${error.message}`)
    }
}
