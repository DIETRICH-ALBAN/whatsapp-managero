import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    MessageSquare,
    ShoppingBag,
    MoreHorizontal,
    Smartphone,
    FileText,
    BarChart2,
    Settings,
    X,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const mainNavItems = [
    { icon: Home, label: 'Accueil', href: '/dashboard' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
    { icon: ShoppingBag, label: 'Ventes', href: '/dashboard/orders' },
]

const allNavItems = [
    { icon: Home, label: 'Vue d\'ensemble', href: '/dashboard', description: 'Tableau de bord principal' },
    { icon: Smartphone, label: 'WhatsApp', href: '/dashboard/whatsapp', description: 'Gérer la connexion' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', description: 'Conversations clients' },
    { icon: ShoppingBag, label: 'Commandes', href: '/dashboard/orders', description: 'Suivi des ventes' },
    { icon: FileText, label: 'Templates IA', href: '/dashboard/templates', description: 'Configuration des agents' },
    { icon: BarChart2, label: 'Analytiques', href: '/dashboard/analytics', description: 'Performances et stats' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings', description: 'Compte et préférences' },
]

export function MobileNav() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 px-6 flex items-center justify-between shadow-[0_-8px_30px_rgb(0,0,0,0.12)] pb-safe">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-1 min-w-[64px] active:scale-95 transition-transform"
                        >
                            <div className={cn(
                                "p-1.5 rounded-full transition-all duration-300",
                                isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            )}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold transition-colors uppercase tracking-tight",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}

                {/* More / Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 min-w-[64px] active:scale-95 transition-transform"
                >
                    <div className={cn(
                        "p-1.5 rounded-full transition-all duration-300",
                        isMenuOpen ? "bg-primary text-white scale-110" : "text-muted-foreground"
                    )}>
                        <MoreHorizontal className="w-5 h-5" />
                    </div>
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-tight",
                        isMenuOpen ? "text-primary" : "text-muted-foreground"
                    )}>
                        Plus
                    </span>
                </button>
            </div>

            {/* Full Screen Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-background md:hidden p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Menu Vibe</h2>
                                <p className="text-xs text-muted-foreground">Toutes vos fonctionnalités</p>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 bg-muted rounded-full hover:bg-muted/80"
                            >
                                <X className="w-6 h-6 text-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pb-20">
                            {allNavItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                                            isActive
                                                ? "bg-primary/5 border-primary/20 text-foreground"
                                                : "bg-muted/30 border-transparent text-muted-foreground active:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-xl shadow-inner",
                                            isActive ? "bg-primary text-white" : "bg-card text-slate-400"
                                        )}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className={cn("font-bold text-base", isActive && "text-primary")}>
                                                {item.label}
                                            </div>
                                            <div className="text-xs opacity-60">
                                                {item.description}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 opacity-20" />
                                    </Link>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
