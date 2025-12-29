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

/**
 * Analyse l'intention d'un message pour le tagging intelligent
 */
export async function analyzeIntent(message: string) {
    try {
        const prompt = `Analyses le message suivant reçu sur WhatsApp et réponds UNIQUEMENT avec un objet JSON au format:
{"tag": "interested" | "support" | "question" | "spam" | "other", "priority": 0-100, "summary": "bref résumé"}

Message: "${message}"`

        const response = await openai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0,
        })

        return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
        console.error('[AI Service] Intent Analysis Error:', error)
        return { tag: 'other', priority: 0, summary: null }
    }
}
