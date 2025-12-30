'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    MessageSquare,
    ShoppingBag,
    MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
    { icon: Home, label: 'Accueil', href: '/dashboard' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages' },
    { icon: ShoppingBag, label: 'Ventes', href: '/dashboard/orders' },
    { icon: MoreHorizontal, label: 'Menu', href: '/dashboard/settings' },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 px-6 flex items-center justify-between shadow-[0_-8px_30px_rgb(0,0,0,0.12)] pb-safe">
            {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center gap-1 min-w-[64px] active:scale-95 transition-transform"
                    >
                        <div className={cn(
                            "p-1.5 rounded-full transition-all duration-300",
                            isActive ? "bg-primary text-white scale-110" : "text-muted-foreground hover:text-foreground"
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
        </div>
    )
}
