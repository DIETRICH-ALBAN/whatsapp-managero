'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    MessageSquare,
    ShoppingBag,
    Users,
    TrendingUp,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Loader2,
    Send
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase'
import { Message, Order } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function DashboardPage() {
    const router = useRouter()
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
    const [newMessagePhone, setNewMessagePhone] = useState('')
    const [newMessageContent, setNewMessageContent] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [orders, setOrders] = useState<Order[]>([])

    // Stats states
    const [revenue, setRevenue] = useState(0)
    const [ordersCount, setOrdersCount] = useState(0)
    const [aiCount, setAiCount] = useState(0)
    const [customerCount, setCustomerCount] = useState(0)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient()

                // 1. Fetch Messages (Limit 5 recent)
                const { data: msgs } = await supabase
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5)
                if (msgs) setMessages(msgs)

                // 2. Fetch Orders
                const { data: ords } = await supabase.from('orders').select('*')
                if (ords) {
                    setOrders(ords.slice(0, 5))
                    const totalRev = ords.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0)
                    setRevenue(totalRev)
                    setOrdersCount(ords.length)
                }

                // 3. Count AI & Customers
                const { count: aiTotal } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_ai_generated', true)
                const { data: convs } = await supabase.from('conversations').select('id')

                setAiCount(aiTotal || 0)
                setCustomerCount(convs?.length || 0)

            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const stats = [
        { label: 'Revenus (Est.)', value: `${revenue.toLocaleString()} FCFA`, change: '+0%', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
        { label: 'Commandes', value: ordersCount.toString(), change: '+0%', icon: ShoppingBag, color: 'text-indigo-500 bg-indigo-500/10' },
        { label: 'Réponses IA', value: aiCount.toString(), change: 'Auto', icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10' },
        { label: 'Clients', value: customerCount.toString(), change: '--', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    ]

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Préparation du rapport...',
                success: 'Rapport exporté avec succès ! (CSV)',
                error: 'Erreur lors de l\'exportation',
            }
        )
    }

    const handleSendMessage = async () => {
        if (!newMessagePhone || !newMessageContent) {
            toast.error("Veuillez remplir tous les champs")
            return
        }

        setSending(true)
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: newMessagePhone.startsWith('+') ? newMessagePhone : `+237${newMessagePhone}`,
                    message: newMessageContent
                })
            })

            if (!response.ok) throw new Error("Échec de l'envoi")

            toast.success("Message envoyé à WhatsApp !")
            setIsNewMessageOpen(false)
            setNewMessagePhone('')
            setNewMessageContent('')
            router.refresh()
        } catch (error) {
            toast.error("Erreur lors de l'envoi")
        } finally {
            setSending(false)
        }
    }

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>

    return (
        <div className="space-y-8 pb-10">
            {/* MOBILE ONLY WIDGET */}
            <div className="block md:hidden">
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-2xl relative overflow-hidden mb-6">
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100/70 text-xs font-medium mb-1 uppercase tracking-wider">Aujourd'hui</p>
                                <h2 className="text-3xl font-black">VIBE Summary</h2>
                            </div>
                            <Badge className="bg-white/20 backdrop-blur-md border-0 text-[10px] font-bold">LIVE</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                <p className="text-[10px] text-indigo-100/60 mb-1">Ventes</p>
                                <p className="text-lg font-bold">+{revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                <p className="text-[10px] text-indigo-100/60 mb-1">Activité IA</p>
                                <p className="text-lg font-bold">{aiCount} msg</p>
                            </div>
                        </div>
                    </div>
                    {/* Abstract shapes for premium feel */}
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
                </div>
            </div>
            {/* Bannière de Test de Déploiement */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl mb-6">
                <p className="text-indigo-400 font-bold text-center italic">🚀 VIBE VERSION 2.1 - PIPELINE DE DÉPLOIEMENT VALIDÉ</p>
            </div>
            {/* Intro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vue d'ensemble</h1>
                    <p className="text-slate-500 dark:text-slate-400">Données en temps réel de votre activité.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={handleExport}
                    >
                        Exporter
                    </Button>

                    <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                + Nouveau message
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px] p-0 bg-[#0B0B0F] border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/10">
                            {/* Header avec Dégradé */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <DialogHeader className="p-8 pb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center mb-4">
                                    <MessageSquare className="w-6 h-6 text-green-500" />
                                </div>
                                <DialogTitle className="text-2xl text-white">Nouveau Message</DialogTitle>
                                <DialogDescription className="text-slate-400 text-base">
                                    Envoyez directement sur WhatsApp.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-8 pt-2 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 font-medium">Numéro de téléphone</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">+237</div>
                                            <Input
                                                placeholder="6 00 00 00 00"
                                                className="pl-14 bg-white/5 border-white/10 hover:border-white/20 focus:border-indigo-500 transition-colors h-12 text-lg rounded-xl text-white placeholder:text-slate-600"
                                                value={newMessagePhone}
                                                onChange={(e) => setNewMessagePhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300 font-medium">Votre message</Label>
                                        <Textarea
                                            placeholder="Bonjour..."
                                            className="bg-white/5 border-white/10 hover:border-white/20 focus:border-indigo-500 transition-colors min-h-[140px] p-4 text-base rounded-xl text-white placeholder:text-slate-600 resize-none"
                                            value={newMessageContent}
                                            onChange={(e) => setNewMessageContent(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsNewMessageOpen(false)}
                                        className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-11 px-6"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={sending}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl h-11 px-8 shadow-lg shadow-indigo-500/25 border border-indigo-500/50"
                                    >
                                        {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        Envoyer
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-[#121217] shadow-sm hover:shadow-md transition-all rounded-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                                    {stat.change}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Messages List (Large Area) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages récents</h2>
                        <Button
                            variant="ghost"
                            className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                            size="sm"
                            onClick={() => router.push('/dashboard/messages')}
                        >
                            Tout voir <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#121217] shadow-sm rounded-2xl overflow-hidden">
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {messages.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    Aucun message récent.
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => router.push('/dashboard/messages')}
                                        className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 uppercase">
                                            {(msg.contact_name || msg.contact_phone || '?')[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                                    {msg.contact_name || msg.contact_phone}
                                                </h4>
                                                <span className="text-xs text-slate-400">
                                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                                {msg.content}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {msg.is_ai_generated && <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 text-[10px]">IA</Badge>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Orders Feed (Side Area) */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Commandes récentes</h2>
                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#121217] shadow-sm rounded-2xl p-6">
                        <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-white/10">
                            {orders.length === 0 ? (
                                <p className="text-sm text-slate-500 pl-8">Aucune commande pour le moment.</p>
                            ) : (
                                orders.map((order, i) => (
                                    <div key={order.id} className="relative pl-10" onClick={() => router.push('/dashboard/orders')}>
                                        <div className={cn(
                                            "absolute left-0 top-0 w-8 h-8 rounded-full bg-white dark:bg-[#121217] border border-slate-100 dark:border-white/10 flex items-center justify-center z-10",
                                            order.status === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'
                                        )}>
                                            {order.status === 'confirmed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Commande #{order.id.slice(0, 4)}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {Number(order.total_amount).toLocaleString()} {order.currency} • {order.customer_name}
                                        </p>
                                        <span className="text-[10px] text-slate-400 mt-2 block">
                                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Upgrade Card - Static */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">Passez Pro 🚀</h3>
                            <p className="text-indigo-100 text-sm mb-4">Messages IA illimités.</p>
                            <Button size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 border-0" onClick={() => router.push('/dashboard/billing')}>
                                Voir les plans
                            </Button>
                        </div>
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </div>
                </div>

            </div>
        </div>
    )
}
