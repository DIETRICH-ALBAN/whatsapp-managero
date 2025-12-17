'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { Message } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function MessagesPage() {
    const [selectedContact, setSelectedContact] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [inputText, setInputText] = useState('')

    // Fetch unique contacts (simulated by grouping messages)
    // In a real app, you'd have a 'contacts' table or distinct query
    const [contacts, setContacts] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchMessages()

        // Realtime subscription
        const channel = supabase
            .channel('messages_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new as Message
                setMessages((prev) => [...prev, newMsg])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data)

                // Extract unique contacts from messages
                const uniqueContacts = Array.from(new Set(data.map(m => m.contact_phone))).map(phone => {
                    const lastMsg = data.filter(m => m.contact_phone === phone).pop()
                    return {
                        phone,
                        name: lastMsg?.contact_name || phone,
                        lastMessage: lastMsg?.content,
                        timestamp: lastMsg?.created_at,
                        unread: 0 // Todo: logic for unread
                    }
                })
                setContacts(uniqueContacts)

                // Select first contact if none selected
                if (!selectedContact && uniqueContacts.length > 0) {
                    setSelectedContact(uniqueContacts[0].phone)
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedContact) return

        const optimisticMsg: Message = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            contact_phone: selectedContact,
            contact_name: activeContact?.name || selectedContact,
            content: inputText,
            direction: 'outbound',
            status: 'new',
            platform: 'whatsapp',
            user_id: 'current-user', // Placeholder
            is_ai_generated: false
        }

        // Optimistic update
        setMessages(prev => [...prev, optimisticMsg])
        setInputText('')

        // Send to DB
        await supabase.from('messages').insert({
            contact_phone: selectedContact,
            content: optimisticMsg.content,
            direction: 'outbound',
            status: 'new'
        })
    }

    const filteredMessages = messages.filter(m => m.contact_phone === selectedContact)
    const activeContact = contacts.find(c => c.phone === selectedContact)

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-[#121217] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-xl">
            {/* Sidebar (Contacts) */}
            <div className="w-80 border-r border-slate-200 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-black/20">
                <div className="p-4 border-b border-slate-200 dark:border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 bg-white dark:bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {contacts.map(contact => (
                        <div
                            key={contact.phone}
                            onClick={() => setSelectedContact(contact.phone)}
                            className={`p-4 flex gap-3 cursor-pointer transition-colors ${selectedContact === contact.phone
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-r-2 border-indigo-500'
                                : 'hover:bg-slate-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {contact.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={`text-sm font-semibold truncate ${selectedContact === contact.phone ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'
                                        }`}>
                                        {contact.name}
                                    </h4>
                                    <span className="text-[10px] text-slate-400">
                                        {formatDistanceToNow(new Date(contact.timestamp), { locale: fr })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {contact.lastMessage}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#F0F2F5] dark:bg-[#0B0B0F/50]">
                {/* Chat Header */}
                <div className="h-16 px-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#121217]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            {activeContact?.name[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {activeContact?.name || 'Sélectionnez un contact'}
                            </h3>
                            <p className="text-xs text-indigo-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                En ligne
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Phone className="w-5 h-5 cursor-pointer hover:text-indigo-500 transition-colors" />
                        <Video className="w-5 h-5 cursor-pointer hover:text-indigo-500 transition-colors" />
                        <Search className="w-5 h-5 cursor-pointer hover:text-indigo-500 transition-colors" />
                        <MoreVertical className="w-5 h-5 cursor-pointer hover:text-indigo-500 transition-colors" />
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:opacity-80 bg-repeat bg-[length:400px]">
                    {filteredMessages.map((msg, i) => {
                        const isMe = msg.direction === 'outbound'
                        return (
                            <motion.div
                                key={msg.id || i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm text-sm relative ${isMe
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-[#1E1E24] text-slate-800 dark:text-slate-200 rounded-tl-none'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        <span>
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                                        </span>
                                        {isMe && (
                                            msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-emerald-300" /> : <Check className="w-3 h-3" />
                                        )}
                                    </div>

                                    {/* AI Tag */}
                                    {msg.is_ai_generated && (
                                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                                            <Mic className="w-2 h-2" /> IA
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#121217] border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="text-slate-400 hover:text-indigo-500">
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <Input
                            placeholder="Écrivez un message..."
                            className="bg-slate-100 dark:bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button size="icon" variant="ghost" className="text-slate-400 hover:text-indigo-500">
                            <Mic className="w-5 h-5" />
                        </Button>
                        <Button
                            size="icon"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/20"
                            onClick={handleSendMessage}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
