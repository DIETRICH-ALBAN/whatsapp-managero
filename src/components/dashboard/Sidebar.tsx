'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/logo'
import {
    Home,
    MessageSquare,
    ShoppingBag,
    FileText,
    BarChart2,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    HelpCircle,
    Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { icon: Home, label: 'Vue d\'ensemble', href: '/dashboard' },
    { icon: MessageSquare, label: 'CRM Messages', href: '/dashboard/messages' },
    { icon: Smartphone, label: 'WhatsApp', href: '/dashboard/whatsapp' },
    { icon: ShoppingBag, label: 'Commandes', href: '/dashboard/orders' },
    { icon: FileText, label: 'Templates IA', href: '/dashboard/templates' },
    { icon: BarChart2, label: 'Analytiques', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const pathname = usePathname()

    // Éviter les erreurs d'hydratation (Next.js Hydration Mismatch)
    React.useEffect(() => {
        setIsMounted(true)
        console.log('Sidebar monté. Items:', navItems) // DEBUG VIBE
    }, [])

    if (!isMounted) {
        return <div className="h-screen w-[280px] bg-card border-r border-border" /> // Placeholder statique
    }

    return (
        <motion.div
            initial={false}
            animate={{ width: collapsed ? 80 : 280 }}
            className="relative h-screen bg-card border-r border-border flex flex-col z-20 transition-all duration-300 ease-in-out"
        >
            {/* Header / Logo */}
            <div className={cn("h-16 flex items-center px-6 border-b border-border", collapsed ? "justify-center px-0" : "justify-between")}>
                {!collapsed ? (
                    <Logo size="sm" />
                ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                        V
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 py-8 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />

                                {!collapsed && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}

                                {/* Active Indicator Line */}
                                {isActive && !collapsed && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"
                                    />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border space-y-2">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    )
}
