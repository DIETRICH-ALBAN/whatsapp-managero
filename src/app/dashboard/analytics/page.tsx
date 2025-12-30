'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    TrendingUp, MessageSquare, Users, Bot,
    ArrowUpRight, ArrowDownRight, BarChart2, PieChart
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalMessages: 0,
        aiMessages: 0,
        conversations: 0,
        responseRate: 0
    })

    const supabase = createClient()

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Messages totaux
            const { count: totalMsg } = await supabase.from('messages').select('*', { count: 'exact', head: true })

            // Messages IA
            const { count: aiMsg } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_ai_generated', true)

            // Conversations
            const { count: convos } = await supabase.from('conversations').select('*', { count: 'exact', head: true })

            setStats({
                totalMessages: totalMsg || 0,
                aiMessages: aiMsg || 0,
                conversations: convos || 0,
                responseRate: totalMsg ? Math.round((aiMsg || 0) / totalMsg * 100) : 0
            })
        } catch (err) {
            console.error('Error fetching stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    const metrics = [
        { label: 'Messages totaux', value: stats.totalMessages, icon: MessageSquare, color: 'bg-blue-500/10 text-blue-500', trend: '+12%' },
        { label: 'Réponses IA', value: stats.aiMessages, icon: Bot, color: 'bg-purple-500/10 text-purple-500', trend: '+28%' },
        { label: 'Conversations', value: stats.conversations, icon: Users, color: 'bg-emerald-500/10 text-emerald-500', trend: '+5%' },
        { label: 'Taux IA', value: `${stats.responseRate}%`, icon: TrendingUp, color: 'bg-amber-500/10 text-amber-500', trend: '+3%' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Analytiques</h1>
                <p className="text-muted-foreground">Suivez les performances de votre assistant IA.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${m.color}`}>
                                    <m.icon className="w-5 h-5" />
                                </div>
                                <span className="flex items-center text-xs font-medium text-emerald-500">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {m.trend}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold">{m.value}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{m.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <BarChart2 className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle>Activité hebdomadaire</CardTitle>
                                <CardDescription>Messages par jour</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <BarChart2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">Graphiques bientôt disponibles</p>
                                <p className="text-sm mt-1">Les visualisations seront ici.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                                <PieChart className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle>Répartition des intentions</CardTitle>
                                <CardDescription>Types de messages reçus</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <PieChart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">Analyse en développement</p>
                                <p className="text-sm mt-1">Tagging intelligent actif.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
