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
    HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { icon: Home, label: 'Vue d\'ensemble', href: '/dashboard' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
    { icon: ShoppingBag, label: 'Commandes', href: '/dashboard/orders' },
    { icon: FileText, label: 'Templates IA', href: '/dashboard/templates' },
    { icon: BarChart2, label: 'Analytiques', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()

    return (
        <motion.div
            animate={{ width: collapsed ? 80 : 280 }}
            className="relative h-screen bg-white dark:bg-[#0B0B0F] border-r border-slate-200 dark:border-white/5 flex flex-col z-20 transition-all duration-300 ease-in-out"
        >
            {/* Header / Logo */}
            <div className={cn("h-16 flex items-center px-6 border-b border-slate-100 dark:border-white/5", collapsed ? "justify-center px-0" : "justify-between")}>
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
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
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
            <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    )
}
