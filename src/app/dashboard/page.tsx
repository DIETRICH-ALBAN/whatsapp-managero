'use client'

import { motion } from 'framer-motion'
import {
    MessageSquare,
    ShoppingBag,
    Users,
    TrendingUp,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
    // Mock Data
    const stats = [
        { label: 'Revenus du mois', value: '254.000 FCFA', change: '+12%', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
        { label: 'Commandes', value: '45', change: '+5%', icon: ShoppingBag, color: 'text-indigo-500 bg-indigo-500/10' },
        { label: 'Messages IA', value: '1.2k', change: '+24%', icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10' },
        { label: 'Taux de conv.', value: '3.2%', change: '+0.4%', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    ]

    const recentMessages = [
        { id: 1, contact: 'Marie Kemadjou', message: 'Bonjour, est-ce que le sac rouge est dispo ?', time: '2 min', status: 'unread', platform: 'whatsapp' },
        { id: 2, contact: 'Paul Biya (Fake)', message: 'Je voudrais commander 10 pièces.', time: '15 min', status: 'ai_handled', platform: 'whatsapp' },
        { id: 3, contact: 'Client Inconnu', message: 'C\'est combien la livraison à Douala ?', time: '1h', status: 'read', platform: 'whatsapp' },
        { id: 4, contact: 'Sarah M.', message: 'Merci pour la rapidité !', time: '3h', status: 'closed', platform: 'whatsapp' },
    ]

    return (
        <div className="space-y-8">
            {/* Intro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vue d'ensemble</h1>
                    <p className="text-slate-500 dark:text-slate-400">Bienvenue sur votre espace de pilotage.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-full">
                        Exporter
                    </Button>
                    <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                        + Nouveau message
                    </Button>
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
                        <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" size="sm">
                            Tout voir <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#121217] shadow-sm rounded-2xl overflow-hidden">
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {recentMessages.map((msg) => (
                                <div key={msg.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">
                                        {msg.contact[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-semibold text-slate-900 dark:text-white truncate">{msg.contact}</h4>
                                            <span className="text-xs text-slate-400">{msg.time}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                            {msg.message}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {msg.status === 'unread' && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                        {msg.status === 'ai_handled' && <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 text-[10px]">IA</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Notifications / Activity Feed (Side Area) */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activité</h2>
                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#121217] shadow-sm rounded-2xl p-6">
                        <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-white/10">
                            {[
                                { title: 'Nouvelle commande #402', desc: 'Confirmée via WhatsApp', time: '10:42', icon: CheckCircle2, color: 'text-emerald-500' },
                                { title: 'Réponse IA envoyée', desc: 'À Client Inconnu (Prix)', time: '09:30', icon: MessageSquare, color: 'text-purple-500' },
                                { title: 'Stock faible', desc: 'Produit "Sac Cuir" < 3', time: 'Hier', icon: Clock, color: 'text-amber-500' },
                            ].map((item, i) => (
                                <div key={i} className="relative pl-10">
                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-white dark:bg-[#121217] border border-slate-100 dark:border-white/10 flex items-center justify-center z-10 ${item.color}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                    <span className="text-[10px] text-slate-400 mt-2 block">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Upgrade Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Passez Pro 🚀</h3>
                            <p className="text-indigo-100 text-sm mb-4">Débloquez les réponses IA illimitées et l'analytique avancée.</p>
                            <Button size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 border-0">
                                Voir les plans
                            </Button>
                        </div>
                        {/* Decoration */}
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </div>
                </div>

            </div>
        </div>
    )
}
