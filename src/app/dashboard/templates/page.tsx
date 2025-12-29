'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Loader2, Save, Play, RefreshCw, Bot, Plus,
    Trash2, CheckCircle, Settings2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AgentConfig {
    id: string
    name: string
    system_prompt: string
    model: string
    is_active: boolean
    is_default: boolean
    temperature: number
}

export default function TemplatesPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [agents, setAgents] = useState<AgentConfig[]>([])
    const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)

    // Sandbox Chat
    const [testMessage, setTestMessage] = useState('')
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .order('created_at', { ascending: true })

            if (data) {
                setAgents(data)
                if (!selectedAgent && data.length > 0) {
                    // Sélectionner l'agent par défaut ou le premier
                    const defaultAgent = data.find(a => a.is_default) || data[0]
                    setSelectedAgent(defaultAgent)
                }
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
        } finally {
            setLoading(false)
        }
    }

    const createNewAgent = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const newAgent = {
                user_id: user.id,
                name: 'Nouvel Agent',
                system_prompt: 'Tu es un assistant commercial utile.',
                is_active: false,
                is_default: agents.length === 0,
                model: 'openai/gpt-4o-mini'
            }

            const { data, error } = await supabase
                .from('agent_configs')
                .insert(newAgent)
                .select()
                .single()

            if (error) throw error
            toast.success('Nouvel agent créé !')
            await fetchAgents()
            setSelectedAgent(data)
        } catch (err) {
            toast.error('Erreur lors de la création')
        } finally {
            setLoading(false)
        }
    }

    const saveAgent = async () => {
        if (!selectedAgent) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('agent_configs')
                .update({
                    name: selectedAgent.name,
                    system_prompt: selectedAgent.system_prompt,
                    is_active: selectedAgent.is_active,
                    is_default: selectedAgent.is_default,
                    model: selectedAgent.model,
                    temperature: selectedAgent.temperature
                })
                .eq('id', selectedAgent.id)

            if (error) throw error
            toast.success('Configuration sauvegardée !')
            fetchAgents()
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const deleteAgent = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cet agent ?')) return
        try {
            const { error } = await supabase.from('agent_configs').delete().eq('id', id)
            if (error) throw error
            toast.success('Agent supprimé')
            if (selectedAgent?.id === id) setSelectedAgent(null)
            fetchAgents()
        } catch (err) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleTestAgent = async () => {
        if (!testMessage.trim() || !selectedAgent) return

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
                    systemPrompt: selectedAgent.system_prompt
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.details || data.error)
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch (error: any) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Erreur: ${error.message}` }])
        } finally {
            setGenerating(false)
        }
    }

    if (loading && agents.length === 0) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]">

            {/* LEFT: Agent List */}
            <div className="w-full lg:w-72 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Mes Agents</h2>
                    <Button size="icon" variant="outline" onClick={createNewAgent} className="rounded-full h-8 w-8">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-2 max-h-[60vh] lg:max-h-none overflow-y-auto">
                    {agents.map(agent => (
                        <div
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className={cn(
                                "p-4 rounded-xl border cursor-pointer transition-all relative group",
                                selectedAgent?.id === agent.id
                                    ? "bg-indigo-500/10 border-indigo-500 shadow-sm"
                                    : "bg-card border-border hover:border-indigo-400"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    agent.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                                )}>
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{agent.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {agent.is_default ? "Par défaut" : "Modèle alternatif"}
                                    </p>
                                </div>
                                {agent.is_active && (
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MIDDLE: Configuration */}
            {selectedAgent ? (
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
                            <p className="text-muted-foreground">Personnalisez l'intelligence et le ton de {selectedAgent.name}.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => deleteAgent(selectedAgent.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button onClick={saveAgent} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Enregistrer
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Informations de base</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom de l'agent</Label>
                                    <Input
                                        value={selectedAgent.name}
                                        onChange={e => setSelectedAgent({ ...selectedAgent, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Par défaut</Label>
                                        <p className="text-[10px] text-muted-foreground italic">Utilisé si aucun autre agent n'est assigné.</p>
                                    </div>
                                    <Switch
                                        checked={selectedAgent.is_default}
                                        onCheckedChange={v => setSelectedAgent({ ...selectedAgent, is_default: v })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Statut : {selectedAgent.is_active ? 'Actif' : 'Inactif'}</Label>
                                        <p className="text-[10px] text-muted-foreground italic">L'IA répondra en temps réel.</p>
                                    </div>
                                    <Switch
                                        checked={selectedAgent.is_active}
                                        onCheckedChange={v => setSelectedAgent({ ...selectedAgent, is_active: v })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Paramètres IA</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm">Modèle utilisé</Label>
                                    <select
                                        className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={selectedAgent.model}
                                        onChange={e => setSelectedAgent({ ...selectedAgent, model: e.target.value })}
                                    >
                                        <option value="openai/gpt-4o-mini">GPT-4o Mini (Rapide & Économe)</option>
                                        <option value="openai/gpt-4o">GPT-4o (Le plus intelligent)</option>
                                        <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B (Puissant)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-sm text-muted-foreground">Créativité : {selectedAgent.temperature}</Label>
                                    </div>
                                    <input
                                        type="range" min="0" max="1" step="0.1"
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        value={selectedAgent.temperature || 0.7}
                                        onChange={e => setSelectedAgent({ ...selectedAgent, temperature: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-indigo-500/20 shadow-inner">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                <CardTitle>Instructions Système</CardTitle>
                            </div>
                            <CardDescription>
                                Définissez le comportement, le ton et les connaissances de l'agent.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[250px] font-mono text-xs leading-relaxed"
                                value={selectedAgent.system_prompt}
                                onChange={e => setSelectedAgent({ ...selectedAgent, system_prompt: e.target.value })}
                                placeholder="Tu es un vendeur expert..."
                            />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 rounded-2xl border-2 border-dashed border-border opacity-50">
                    <Bot className="w-12 h-12 mb-4" />
                    <p>Sélectionnez un agent pour commencer ou créez-en un nouveau.</p>
                </div>
            )}

            {/* RIGHT: Sandbox */}
            <div className="w-full lg:w-80 flex flex-col bg-muted/30 rounded-xl border border-border overflow-hidden h-full">
                <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-sm">Bac à sable</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setChatHistory([])} className="h-8 w-8">
                        <RefreshCw className="w-3 h-3" />
                    </Button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs custom-scrollbar bg-slate-50 dark:bg-slate-900/10">
                    {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 text-center px-4">
                            <Bot className="w-8 h-8 mb-2" />
                            <p>Envoyez un message pour tester l'agent sélectionné.</p>
                        </div>
                    )}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={cn(
                                "max-w-[90%] rounded-xl px-3 py-2 leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white dark:bg-slate-800 border border-border"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {generating && (
                        <div className="flex justify-start">
                            <div className="bg-card border border-border rounded-xl px-3 py-2">
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-card border-t border-border shrink-0">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Message de test..."
                            className="h-9 text-xs"
                            value={testMessage}
                            onChange={e => setTestMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleTestAgent()}
                        />
                        <Button size="icon" onClick={handleTestAgent} disabled={generating || !testMessage.trim()} className="h-9 w-9">
                            <Play className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
