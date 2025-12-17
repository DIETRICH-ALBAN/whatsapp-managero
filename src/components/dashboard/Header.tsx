'use client'

import React from 'react'
import { Bell, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function Header({ user }: { user: any }) {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-[#0B0B0F]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-10">

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Rechercher une commande, un message..."
                    className="pl-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-indigo-500 rounded-full h-10 text-sm"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0B0B0F]" />
                </button>

                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 outline-none">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                                    {user?.user_metadata?.full_name || 'Utilisateur'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Plan Basic
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-white/10">
                                {user?.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2">
                        <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profil</DropdownMenuItem>
                        <DropdownMenuItem>Facturation</DropdownMenuItem>
                        <DropdownMenuItem>Paramètres</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleLogout}>
                            Se déconnecter
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
