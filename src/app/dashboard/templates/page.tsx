'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Play, RefreshCw, Bot, User } from 'lucide-react'
import { toast } from 'sonner'

export default function TemplatesPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)

    // Config Agent
    const [configId, setConfigId] = useState<string | null>(null)
    const [agentName, setAgentName] = useState('Mon Assistant')
    const [systemPrompt, setSystemPrompt] = useState('Tu es un assistant commercial utile et courtois.')
    const [isActive, setIsActive] = useState(false)

    // Sandbox Chat
    const [testMessage, setTestMessage] = useState('')
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setConfigId(data.id)
                setAgentName(data.name)
                setSystemPrompt(data.system_prompt)
                setIsActive(data.is_active)
            }
        } catch (error) {
            console.error('Error fetching config:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveConfig = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const updates = {
                user_id: user.id,
                name: agentName,
                system_prompt: systemPrompt,
                is_active: isActive,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('agent_configs')
                .upsert(updates, { onConflict: 'user_id' })

            if (error) throw error
            toast.success('Configuration sauvegardée !')
            fetchConfig() // Refresh ID if new
        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleTestAgent = async () => {
        if (!testMessage.trim()) return

        const userMsg = testMessage
        const newHistory = [...chatHistory, { role: 'user' as const, content: userMsg }]
        setChatHistory(newHistory)
        setTestMessage('')
        setGenerating(true)

        try {
            const response = await fetch('/api/ai/sandbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory,
                    systemPrompt: systemPrompt
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Erreur API')
            }

            setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch (error: any) {
            console.error('Error testing:', error)
            setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Erreur: ${error.message}` }])
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">

            {/* LEFT: Configuration */}
            <div className="space-y-6 overflow-y-auto pr-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Configuration de l'Agent</h2>
                    <p className="text-muted-foreground">Définissez la personnalité et les règles de votre assistant.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Identité</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nom de l'agent</Label>
                            <Input value={agentName} onChange={e => setAgentName(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Activation automatique</Label>
                                <CardDescription>L'agent répondra automatiquement aux nouveaux messages.</CardDescription>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Prompt Système (Instructions)</CardTitle>
                        <CardDescription>
                            Décrivez comment l'IA doit se comporter. Soyez précis sur le ton et les informations à donner.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            className="min-h-[300px] font-mono text-sm leading-relaxed"
                            value={systemPrompt}
                            onChange={e => setSystemPrompt(e.target.value)}
                            placeholder="Ex: Tu es Sophie, assistante virtuelle de VibeVendor. Tu es polie, concise et tu utilises des émojis..."
                        />
                        <Button onClick={saveConfig} disabled={saving} className="w-full mt-4">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Sauvegarder la configuration
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: Sandbox */}
            <div className="flex flex-col h-full bg-muted/30 rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold">Bac à sable (Test)</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChatHistory([])}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Bot className="w-12 h-12 mb-2" />
                            <p>Envoyez un message pour tester votre agent</p>
                        </div>
                    )}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-tr-none'
                                : 'bg-card border border-border rounded-tl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {generating && (
                        <div className="flex justify-start">
                            <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-2">
                                <span className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-200" />
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-card border-t border-border">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Écrivez un message de test..."
                            value={testMessage}
                            onChange={e => setTestMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleTestAgent()}
                        />
                        <Button size="icon" onClick={handleTestAgent} disabled={generating || !testMessage.trim()}>
                            <Play className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
