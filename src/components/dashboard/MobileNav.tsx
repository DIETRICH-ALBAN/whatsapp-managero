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
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 px-6 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center gap-1 min-w-[64px]"
                    >
                        <div className={cn(
                            "p-1.5 rounded-full transition-colors",
                            isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
                        )}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium transition-colors",
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
