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
    ArrowLeft
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { cn } from '@/lib/utils'

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
}

interface Message {
    id: string
    content: string
    direction: 'inbound' | 'outbound'
    status: 'sent' | 'delivered' | 'read' | 'failed'
    created_at: string
    is_ai_generated?: boolean
    conversation_id: string
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
    const [loadingConvos, setLoadingConvos] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [inputText, setInputText] = useState('')

    // Pour le mobile : afficher la liste ou le chat
    const [showChatOnMobile, setShowChatOnMobile] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // 1. Fetch Conversations
    useEffect(() => {
        fetchConversations()

        // Realtime Subscription for Conversations list updates
        const channel = supabase
            .channel('conversations_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
                fetchConversations() // Simple reload for MVP
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // 2. Fetch Messages when Conversation Selected
    useEffect(() => {
        if (!selectedConvoId) return

        fetchMessages(selectedConvoId)

        // Realtime Subscription for Messages in active chat
        const channel = supabase
            .channel(`chat:${selectedConvoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedConvoId}`
            }, (payload) => {
                const newMsg = payload.new as Message
                setMessages(prev => [...prev, newMsg])
                scrollToBottom()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedConvoId])

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('updated_at', { ascending: false })

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
                // Mark as read (Todo)
            }
        } catch (err) {
            console.error('Error loading messages:', err)
        } finally {
            setLoadingMessages(false)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedConvoId) return

        const currentConvo = conversations.find(c => c.id === selectedConvoId)
        if (!currentConvo) return

        // 1. Optimistic Update UI
        const optimisticMsg: Message = {
            id: crypto.randomUUID(),
            content: inputText,
            direction: 'outbound',
            status: 'sent',
            created_at: new Date().toISOString(),
            conversation_id: selectedConvoId
        }
        setMessages(prev => [...prev, optimisticMsg])
        const messageToSend = inputText
        setInputText('')
        scrollToBottom()

        // 2. Appel API pour envoyer via WhatsApp
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: currentConvo.contact_phone,
                    message: messageToSend,
                    conversationId: selectedConvoId
                })
            })

            const result = await response.json()

            if (!response.ok) {
                console.error('Erreur envoi:', result.error)
                // Marquer le message comme échoué
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m
                ))
            }

        } catch (err) {
            console.error('Failed to send message:', err)
            setMessages(prev => prev.map(m =>
                m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m
            ))
        }
    }

    const activeConversation = conversations.find(c => c.id === selectedConvoId)

    // Aide pour formater le numéro ou le nom
    const formatIdentifier = (convo: Conversation) => {
        let name = convo.contact_name || convo.contact_phone
        // Nettoyer les IDs techniques si c'est juste des chiffres
        if (/^\d+$/.test(name) && name.includes('120363')) {
            return `Groupe: ${convo.contact_phone.substring(0, 10)}...`
        }
        // Ajouter un + si c'est un numéro pur
        if (/^\d+$/.test(name) && !name.startsWith('+')) {
            return `+${name}`
        }
        return name
    }

    if (loadingConvos) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)] bg-card rounded-3xl overflow-hidden border border-border shadow-2xl relative">

            {/* LEFT PANEL: Conversations List */}
            <div className={cn(
                "w-full md:w-96 border-r border-border flex flex-col bg-muted/20 backdrop-blur-sm",
                showChatOnMobile ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-bold mb-4 px-2">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un client..."
                            className="pl-9 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 opacity-20" />
                            </div>
                            <p>Aucune conversation trouvée</p>
                            <p className="text-xs mt-1">Vos messages WhatsApp apparaîtront ici.</p>
                        </div>
                    ) : (
                        conversations.map(convo => (
                            <div
                                key={convo.id}
                                onClick={() => {
                                    setSelectedConvoId(convo.id)
                                    setShowChatOnMobile(true)
                                }}
                                className={cn(
                                    "p-4 flex gap-4 cursor-pointer transition-all border-b border-border/30 hover:bg-indigo-500/5 items-center",
                                    selectedConvoId === convo.id ? "bg-indigo-500/10 border-l-4 border-l-indigo-500" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                                            {convo.contact_name?.[0]?.toUpperCase() || convo.contact_phone?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Badge IA Actif */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full border-2 border-background flex items-center justify-center shadow-lg" title="Agent IA Actif">
                                        <Mic className="w-2.5 h-2.5 text-white" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className={cn("text-sm font-bold truncate",
                                            selectedConvoId === convo.id ? "text-indigo-600 dark:text-indigo-400" : "text-foreground"
                                        )}>
                                            {formatIdentifier(convo)}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                            {convo.last_message_at && formatDistanceToNow(new Date(convo.last_message_at), { locale: fr, addSuffix: false }).replace('environ ', '')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-muted-foreground truncate leading-tight flex-1">
                                            {convo.last_message || "Nouvelle discussion"}
                                        </p>
                                        {convo.unread_count > 0 && (
                                            <span className="bg-indigo-600 text-white text-[10px] font-bold h-4 min-w-[1rem] px-1 rounded-full flex items-center justify-center shadow-sm">
                                                {convo.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-background/50 backdrop-blur-sm",
                !showChatOnMobile ? "hidden md:flex" : "flex"
            )}>
                {!selectedConvoId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/5">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 shadow-inner"
                        >
                            <Phone className="w-10 h-10 text-indigo-500" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Vos messages WhatsApp</h3>
                        <p className="max-w-xs mx-auto text-sm opacity-60">
                            Sélectionnez une discussion pour répondre à vos clients ou laisser l'agent VIBE gérer la vente.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-8 w-8" onClick={() => setShowChatOnMobile(false)}>
                                    <ArrowLeft className="w-5 h-5 text-indigo-500" />
                                </Button>

                                <Avatar className="w-10 h-10 border border-border shadow-sm">
                                    <AvatarFallback className="bg-indigo-500/10 text-indigo-500 font-bold">
                                        {activeConversation?.contact_name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                                        {activeConversation && formatIdentifier(activeConversation)}
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">
                                        Géré par l'Agent IA VIBE
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500">
                                    <Phone className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {loadingMessages ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500/50" />
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMe = msg.direction === 'outbound'
                                        return (
                                            <motion.div
                                                key={msg.id || i}
                                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                                            >
                                                <div className={cn(
                                                    "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group transition-all",
                                                    isMe
                                                        ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20"
                                                        : "bg-card text-card-foreground border border-border rounded-tl-none"
                                                )}>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    <div className={cn(
                                                        "flex items-center justify-end gap-1.5 text-[9px] mt-1 opacity-60 font-medium",
                                                        isMe ? "text-indigo-100" : "text-muted-foreground"
                                                    )}>
                                                        <span>
                                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                                                        </span>
                                                        {isMe && (
                                                            <CheckCheck className="w-3 h-3" />
                                                        )}
                                                    </div>

                                                    {msg.is_ai_generated && (
                                                        <div className="absolute -top-2.5 -right-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 font-bold backdrop-blur-sm">
                                                            <Mic className="w-2.5 h-2.5" /> IA
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                )}
                            </AnimatePresence>
                            <div ref={scrollRef} className="h-4" />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border mt-auto">
                            <div className="flex items-end gap-3 max-w-4xl mx-auto bg-muted/50 p-2 rounded-2xl border border-border focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                                <Button size="icon" variant="ghost" className="text-muted-foreground h-10 w-10 shrink-0 hover:bg-indigo-500/10 hover:text-indigo-500 rounded-xl">
                                    <Paperclip className="w-5 h-5" />
                                </Button>

                                <textarea
                                    placeholder="Répondre à votre client..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 min-h-[44px] max-h-32 resize-none custom-scrollbar outline-none"
                                    rows={1}
                                    value={inputText}
                                    onChange={(e) => {
                                        setInputText(e.target.value)
                                        e.target.style.height = 'auto'
                                        e.target.style.height = `${e.target.scrollHeight}px`
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                />

                                <div className="flex items-center gap-1 shrink-0 px-2 pb-0.5">
                                    <Button
                                        size="icon"
                                        className={cn(
                                            "h-10 w-10 rounded-xl transition-all shadow-lg",
                                            inputText.trim()
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white scale-110"
                                                : "bg-muted text-muted-foreground scale-100 cursor-not-allowed"
                                        )}
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground mt-3 opacity-50 flex items-center justify-center gap-1">
                                <Mic className="w-2 h-2" /> L'Agent IA peut répondre pour vous si vous ne le faites pas.
                            </p>
                        </div>
                    </>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    )
}
