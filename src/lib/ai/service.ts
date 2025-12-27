import OpenAI from 'openai'

// On utilise une clé par défaut pour le développement si non définie
// Dans un vrai prod, on gérerait ça via des variables d'env sécurisées ou KMS
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "https://whatsapp-managero.vercel.app", // Optionnel, pour OpenRouter
        "X-Title": "VibeVendor", // Optionnel
    },
    dangerouslyAllowBrowser: true
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
            model: config.model || 'openai/gpt-4o-mini',
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
