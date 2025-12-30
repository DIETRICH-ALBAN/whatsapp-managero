'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    MoreVertical,
    Phone,
    Video,
    Send,
    Paperclip,
    Mic,
    Check,
    CheckCheck,
    Loader2,
    ArrowLeft,
    Sparkles,
    Bot,
    Trash2,
    RefreshCw
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Types (Frontend definitions matching DB)
interface Message {
    id: string
    content: string
    direction: 'inbound' | 'outbound'
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'received'
    created_at: string
    is_ai_generated?: boolean
    conversation_id: string
    message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker'
    media_url?: string
}

// Types (Frontend definitions matching DB)
interface Conversation {
    id: string
    contact_name: string
    contact_phone: string
    last_message: string
    last_message_at: string
    unread_count: number
    status: 'active' | 'archived'
    updated_at: string
    intent_tag?: 'interested' | 'support' | 'question' | 'spam' | 'other'
    priority_score?: number
    agent_id?: string
    is_ai_enabled?: boolean
    summary?: string
}

interface Agent {
    id: string
    name: string
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])
    const [loadingConvos, setLoadingConvos] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [inputText, setInputText] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredConversations = conversations.filter(c => {
        const query = searchQuery.toLowerCase()
        return (
            c.contact_name?.toLowerCase().includes(query) ||
            c.contact_phone?.includes(query) ||
            c.last_message?.toLowerCase().includes(query)
        )
    })

    // Pour le mobile : afficher la liste ou le chat
    const [showChatOnMobile, setShowChatOnMobile] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // 1. Fetch Conversations & Agents
    useEffect(() => {
        fetchConversations()
        fetchAgents()

        // Realtime Subscription for Conversations list updates
        const channel = supabase
            .channel('conversations_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
                fetchConversations()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchAgents = async () => {
        const { data } = await supabase.from('agent_configs').select('id, name')
        if (data) setAgents(data)
    }

    // 2. Fetch Messages when Conversation Selected
    useEffect(() => {
        if (!selectedConvoId) return
        fetchMessages(selectedConvoId)
        setSuggestions([]) // Reset

        const channel = supabase
            .channel(`chat:${selectedConvoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedConvoId}`
            }, (payload) => {
                const newMsg = payload.new as Message
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev
                    return [...prev, newMsg]
                })
                scrollToBottom()
                // Si c'est un message entrant, on régénère des suggestions
                if (newMsg.direction === 'inbound') fetchSuggestions(newMsg.content)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [selectedConvoId])

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('last_message_at', { ascending: false, nullsFirst: false })

            if (error) throw error
            if (data) setConversations(data)
        } catch (err) {
            console.error('Error loading conversations:', err)
        } finally {
            setLoadingConvos(false)
        }
    }

    const fetchMessages = async (chatId: string) => {
        setLoadingMessages(true)
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', chatId)
                .order('created_at', { ascending: true })

            if (error) throw error
            if (data) {
                setMessages(data)
                scrollToBottom()
                // Réinitialiser unread count
                await supabase.from('conversations').update({ unread_count: 0 }).eq('id', chatId)
            }
        } catch (err) {
            console.error('Error loading messages:', err)
        } finally {
            setLoadingMessages(false)
        }
    }

    const fetchSuggestions = async (message: string) => {
        setLoadingSuggestions(true)
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: selectedConvoId,
                    message: `Suggères 3 réponses courtes et professionnelles pour ce message: "${message}". Réponds UNIQUEMENT par une liste séparée par des points-virgules.`
                })
            })
            const data = await res.json()
            if (data.response) {
                const suggs = data.response.split(';').map((s: string) => s.trim().replace(/^["-]\s?|["-]$/g, ''))
                setSuggestions(suggs.slice(0, 3))
            }
        } catch (err) {
            console.error('Suggestions error:', err)
        } finally {
            setLoadingSuggestions(false)
        }
    }

    const updateConvoSetting = async (key: string, value: any) => {
        if (!selectedConvoId) return
        try {
            await supabase.from('conversations').update({ [key]: value }).eq('id', selectedConvoId)
            fetchConversations()
            toast.success('Paramètre mis à jour')
        } catch (err) {
            toast.error('Erreur mise à jour')
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSendMessage = async (text?: string) => {
        const content = text || inputText
        if (!content.trim() || !selectedConvoId) return

        const currentConvo = conversations.find(c => c.id === selectedConvoId)
        if (!currentConvo) return

        // 1. Optimistic Update UI
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            content: content,
            direction: 'outbound',
            status: 'sent',
            created_at: new Date().toISOString(),
            conversation_id: selectedConvoId
        }
        setMessages(prev => [...prev, optimisticMsg])
        if (!text) setInputText('')
        setSuggestions([])
        scrollToBottom()

        // 2. Appel API pour envoyer via WhatsApp
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: currentConvo.contact_phone,
                    message: content,
                    conversationId: selectedConvoId
                })
            })

            if (!response.ok) {
                setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m))
            }
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m))
        }
    }

    const activeConversation = conversations.find(c => c.id === selectedConvoId)

    const getIntentInfo = (tag?: string) => {
        switch (tag) {
            case 'interested': return { label: 'Opportunité', color: 'bg-emerald-500', icon: Sparkles }
            case 'support': return { label: 'Support', color: 'bg-blue-500', icon: Phone }
            case 'question': return { label: 'Question', color: 'bg-amber-500', icon: Bot }
            case 'spam': return { label: 'Spam', color: 'bg-red-500', icon: Trash2 }
            default: return { label: null, color: 'bg-slate-400', icon: null }
        }
    }

    const formatIdentifier = (convo: Conversation) => {
        if (!convo) return "Inconnu"

        // Détecter si c'est un groupe par son format d'ID (contient souvent un tiret ou une longue chaîne)
        const isGroup = convo.contact_phone.includes('-') || convo.contact_phone.length > 15

        if (isGroup) {
            return convo.contact_name || `Groupe WhatsApp`
        }

        // Si le nom est différent du numéro, on affiche le nom
        if (convo.contact_name && convo.contact_name !== convo.contact_phone) {
            return convo.contact_name
        }

        // Sinon on affiche le numéro formaté
        const phone = convo.contact_phone.replace(/\D/g, '')
        return phone.startsWith('+') ? phone : `+${phone}`
    }

    if (loadingConvos) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
    }

    return (
        <div className="flex h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)] bg-card rounded-3xl overflow-hidden border border-border shadow-2xl relative">

            {/* LEFT PANEL: Conversations List */}
            <div className={cn(
                "w-full md:w-96 border-r border-border flex flex-col bg-muted/20 backdrop-blur-sm",
                showChatOnMobile ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold">Messages</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-white/5"
                            onClick={() => { fetchConversations(); toast.success('Mise à jour...'); }}
                        >
                            <RefreshCw className={cn("w-4 h-4 text-slate-400", loadingConvos && "animate-spin")} />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.map(convo => {
                        const intent = getIntentInfo(convo.intent_tag)
                        return (
                            <div
                                key={convo.id}
                                onClick={() => { setSelectedConvoId(convo.id); setShowChatOnMobile(true); }}
                                className={cn(
                                    "p-4 flex gap-4 cursor-pointer transition-all border-b border-border/30 hover:bg-indigo-500/5 items-center",
                                    selectedConvoId === convo.id ? "bg-indigo-500/10 border-l-4 border-l-indigo-500 shadow-inner" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                            {convo.contact_name?.[0]?.toUpperCase() || convo.contact_phone?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {convo.is_ai_enabled !== false && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                                            <Bot className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className={cn("text-xs font-bold truncate", selectedConvoId === convo.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>
                                            {formatIdentifier(convo)}
                                        </h4>
                                        <span className="text-[9px] text-muted-foreground font-medium shrink-0">
                                            {convo.last_message_at && formatDistanceToNow(new Date(convo.last_message_at), { locale: fr })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-1">
                                        {intent.label && (
                                            <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold", intent.color)}>
                                                {intent.label}
                                            </span>
                                        )}
                                        {convo.priority_score && convo.priority_score > 50 && (
                                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold border border-red-200">
                                                Prioritaire
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[10px] text-muted-foreground truncate leading-tight flex-1">
                                            {convo.last_message || "Nouvelle discussion"}
                                        </p>
                                        {convo.unread_count > 0 && (
                                            <span className="bg-indigo-600 text-white text-[9px] font-bold h-3.5 min-w-[3.5] px-1 rounded-full flex items-center justify-center">
                                                {convo.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT PANEL: Chat Area */}
            <div className={cn("flex-1 flex flex-col bg-background/50 backdrop-blur-sm", !showChatOnMobile ? "hidden md:flex" : "flex")}>
                {!selectedConvoId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                        <Bot className="w-16 h-16 text-indigo-500/20 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Centre de Messagerie IA</h3>
                        <p className="max-w-xs text-sm opacity-50">Gérez vos prospects et vos clients avec la puissance de l'IA.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowChatOnMobile(false)}><ArrowLeft className="w-5 h-5" /></Button>
                                <Avatar className="w-10 h-10 border border-border shadow-sm">
                                    <AvatarFallback>{activeConversation?.contact_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-xs">{activeConversation && formatIdentifier(activeConversation)}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        <p className="text-[9px] text-muted-foreground font-medium">En ligne</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Control Bar */}
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-1.5 px-3 rounded-2xl border border-white/10 shadow-xl">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                        activeConversation?.is_ai_enabled ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-500"
                                    )}>
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-[10px] font-bold text-slate-400 leading-none mb-1">AGENT IA</p>
                                        <select
                                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer hover:text-indigo-400 transition-colors appearance-none pr-4"
                                            style={{ backgroundColor: '#0D0D12' }} // Force background for some mobile browsers
                                            value={activeConversation?.agent_id || ''}
                                            onChange={(e) => updateConvoSetting('agent_id', e.target.value)}
                                        >
                                            <option value="" style={{ backgroundColor: '#1A1A24' }}>Agent par défaut</option>
                                            {agents.map(a => (
                                                <option key={a.id} value={a.id} style={{ backgroundColor: '#1A1A24' }}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[9px] font-black tracking-tighter uppercase",
                                        activeConversation?.is_ai_enabled ? "text-indigo-400" : "text-slate-500")}>
                                        {activeConversation?.is_ai_enabled ? 'ACTIF' : 'OFF'}
                                    </span>
                                    <Switch
                                        className="scale-75 data-[state=checked]:bg-indigo-500"
                                        checked={activeConversation?.is_ai_enabled}
                                        onCheckedChange={(v) => updateConvoSetting('is_ai_enabled', v)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar">
                            {messages.map((msg, i) => {
                                const isMe = msg.direction === 'outbound'
                                return (
                                    <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm relative group",
                                            isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-card border border-border rounded-tl-none"
                                        )}>
                                            {/* Rendu des médias */}
                                            {msg.media_url && msg.message_type === 'image' && (
                                                <img
                                                    src={msg.media_url}
                                                    alt="Image"
                                                    className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(msg.media_url, '_blank')}
                                                />
                                            )}
                                            {msg.media_url && msg.message_type === 'video' && (
                                                <video
                                                    src={msg.media_url}
                                                    controls
                                                    className="rounded-lg max-w-full mb-2"
                                                />
                                            )}
                                            {msg.media_url && msg.message_type === 'audio' && (
                                                <audio
                                                    src={msg.media_url}
                                                    controls
                                                    className="w-full mb-2"
                                                />
                                            )}
                                            {msg.media_url && msg.message_type === 'document' && (
                                                <a
                                                    href={msg.media_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 mb-2 hover:bg-muted transition-colors"
                                                >
                                                    <span className="text-lg">📄</span>
                                                    <span className="text-xs font-medium underline">Télécharger le document</span>
                                                </a>
                                            )}

                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            {msg.is_ai_generated && (
                                                <div className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-md border border-indigo-200">IA</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                            <div ref={scrollRef} className="h-2" />
                        </div>

                        {/* Suggestions Area */}
                        {suggestions.length > 0 && (
                            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-indigo-500/5 backdrop-blur-sm border-t border-indigo-500/10">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(s)}
                                        className="whitespace-nowrap bg-white dark:bg-slate-800 text-[10px] px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 font-medium hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border mt-auto">
                            <div className="flex items-end gap-2 max-w-4xl mx-auto bg-muted/30 p-2 rounded-2xl border border-border focus-within:ring-2 focus-within:ring-indigo-500/20">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file || !selectedConvoId) return

                                        const toastId = toast.loading('Envoi du fichier...')

                                        try {
                                            const ext = file.name.split('.').pop()
                                            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

                                            // 1. Upload to Supabase
                                            const { data: uploadData, error: uploadError } = await supabase.storage
                                                .from('whatsapp-media')
                                                .upload(fileName, file, { contentType: file.type })

                                            if (uploadError) throw new Error('Erreur upload: ' + uploadError.message)

                                            const { data: { publicUrl } } = supabase.storage.from('whatsapp-media').getPublicUrl(fileName)

                                            // 2. Determine type
                                            let type = 'document'
                                            if (file.type.startsWith('image/')) type = 'image'
                                            else if (file.type.startsWith('video/')) type = 'video'
                                            else if (file.type.startsWith('audio/')) type = 'audio'

                                            // 3. Send via API
                                            const response = await fetch('/api/whatsapp/send-media', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    phoneNumber: activeConversation?.contact_phone,
                                                    mediaUrl: publicUrl,
                                                    type: type,
                                                    caption: file.name,
                                                    conversationId: selectedConvoId
                                                })
                                            })

                                            if (!response.ok) throw new Error('Erreur envoi WhatsApp')

                                            toast.success('Fichier envoyé !', { id: toastId })

                                            // Optimistic add
                                            const optimisticMsg: Message = {
                                                id: `temp-${Date.now()}`,
                                                content: file.name,
                                                direction: 'outbound',
                                                status: 'sent',
                                                created_at: new Date().toISOString(),
                                                conversation_id: selectedConvoId,
                                                message_type: type as any,
                                                media_url: publicUrl
                                            }
                                            setMessages(prev => [...prev, optimisticMsg])
                                            scrollToBottom()

                                        } catch (err: any) {
                                            console.error(err)
                                            toast.error('Erreur: ' + err.message, { id: toastId })
                                        }

                                        // Reset input
                                        e.target.value = ''
                                    }}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                <textarea
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-2 min-h-[40px] max-h-32 resize-none outline-none"
                                    rows={1}
                                    value={inputText}
                                    placeholder="Écrire un message..."
                                    onChange={(e) => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                />
                                <Button size="icon" className={cn("h-9 w-9 shrink-0 rounded-xl", inputText.trim() ? "bg-indigo-600" : "bg-muted text-muted-foreground")} onClick={() => handleSendMessage()} disabled={!inputText.trim()}><Send className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}
