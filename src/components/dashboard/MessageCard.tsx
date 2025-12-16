'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MotionCard } from '@/lib/animations'
import { MessageCircle, Clock } from 'lucide-react'

interface Message {
    id: string
    senderName: string
    preview: string
    timestamp: string
    isUnread: boolean
    avatar?: string
}

interface MessageCardProps {
    messages: Message[]
    title?: string
    delay?: number
}

export function MessageCard({ messages, title = "Messages Récents", delay = 0 }: MessageCardProps) {
    return (
        <MotionCard delay={delay}>
            <Card variant="elevated" className="h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-indigo-500" />
                        {title}
                    </CardTitle>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {messages.filter(m => m.isUnread).length} non lus
                    </span>
                </CardHeader>
                <CardContent className="space-y-3">
                    {messages.length === 0 ? (
                        <p className="text-center py-8 text-slate-400">Aucun message</p>
                    ) : (
                        messages.slice(0, 5).map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer
                  ${message.isUnread
                                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-indigo-500'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium shrink-0">
                                    {message.senderName.charAt(0).toUpperCase()}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-medium truncate ${message.isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {message.senderName}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                                            <Clock className="h-3 w-3" />
                                            {message.timestamp}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate mt-0.5 ${message.isUnread ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {message.preview}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </MotionCard>
    )
}
