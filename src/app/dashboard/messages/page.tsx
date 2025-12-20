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
import { fr } from 'date-fns/locale'
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
        setInputText('')
        scrollToBottom()

        // 2. Send to Backend (API)
        // Note: For MVP we just insert to DB, but ideally we call an API that calls WhatsApp Cloud API
        try {
            // TODO: Call API /api/whatsapp/send
            // For now, manual insert to simulate sent message
            const { error } = await supabase.from('messages').insert({
                conversation_id: selectedConvoId,
                contact_phone: currentConvo.contact_phone,
                content: optimisticMsg.content,
                direction: 'outbound',
                status: 'sent'
            })

            if (error) throw error

            // Update conversation last message
            await supabase.from('conversations').update({
                last_message: optimisticMsg.content,
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).eq('id', selectedConvoId)

        } catch (err) {
            console.error('Failed to send message:', err)
            // Rollback optimistic update if needed
        }
    }

    const activeConversation = conversations.find(c => c.id === selectedConvoId)

    if (loadingConvos) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card rounded-3xl overflow-hidden border border-border shadow-sm">

            {/* LEFT PANEL: Conversations List */}
            <div className={cn(
                "w-full md:w-80 border-r border-border flex flex-col bg-muted/30",
                showChatOnMobile ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-border bg-card">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                            <p>Aucune conversation</p>
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
                                    "p-4 flex gap-3 cursor-pointer transition-all border-b border-border/50 hover:bg-muted/50",
                                    selectedConvoId === convo.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <Avatar className="w-10 h-10 border border-border">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">
                                        {convo.contact_name?.[0]?.toUpperCase() || '#'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className={cn("text-sm font-semibold truncate",
                                            selectedConvoId === convo.id ? "text-primary" : "text-foreground"
                                        )}>
                                            {convo.contact_name || convo.contact_phone}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground">
                                            {convo.last_message_at && formatDistanceToNow(new Date(convo.last_message_at), { locale: fr })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate font-medium">
                                        {convo.last_message || "Nouvelle conversation"}
                                    </p>
                                </div>
                                {convo.unread_count > 0 && (
                                    <div className="min-w-[1.25rem] h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center px-1">
                                        {convo.unread_count}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-background",
                !showChatOnMobile ? "hidden md:flex" : "flex"
            )}>
                {!selectedConvoId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Phone className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">WhatsApp Web</h3>
                        <p>Sélectionnez une conversation pour commencer à discuter avec vos clients.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowChatOnMobile(false)}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>

                                <Avatar className="w-10 h-10 border border-border">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {activeConversation?.contact_name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm text-foreground">
                                        {activeConversation?.contact_name || activeConversation?.contact_phone}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {activeConversation?.contact_phone}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Button variant="ghost" size="icon"><Phone className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon"><Search className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                            {loadingMessages ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.direction === 'outbound'
                                    return (
                                        <motion.div
                                            key={msg.id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                                        >
                                            <div className={cn(
                                                "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                    : "bg-card text-card-foreground border border-border rounded-tl-none"
                                            )}>
                                                <p className="leading-relaxed">{msg.content}</p>
                                                <div className={cn(
                                                    "flex items-center justify-end gap-1 text-[10px] mt-1 opacity-70",
                                                    isMe ? "text-white" : "text-muted-foreground"
                                                )}>
                                                    <span>
                                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                                                    </span>
                                                    {isMe && (
                                                        <CheckCheck className="w-3 h-3" />
                                                    )}
                                                </div>

                                                {msg.is_ai_generated && (
                                                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                                                        <Mic className="w-2 h-2" /> IA
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-card border-t border-border">
                            <div className="flex items-end gap-2 bg-muted/50 p-2 rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
                                <Button size="icon" variant="ghost" className="text-muted-foreground h-10 w-10 shrink-0">
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <Input
                                    placeholder="Écrivez un message..."
                                    className="bg-transparent border-none focus-visible:ring-0 min-h-[44px] py-3"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" className="text-muted-foreground h-10 w-10">
                                        <Mic className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
