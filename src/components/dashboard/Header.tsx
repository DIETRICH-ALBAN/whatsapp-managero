'use client'

import React from 'react'
import { Bell, Search, User, CreditCard, Settings, LogOut } from 'lucide-react'
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
        <header className="h-16 flex items-center justify-between px-8 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher une commande, un message..."
                    className="pl-10 bg-muted border-input focus:ring-primary rounded-full h-10 text-sm"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
                </button>

                <div className="h-8 w-px bg-border mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 outline-none">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-foreground leading-none">
                                    {user?.user_metadata?.full_name || 'Utilisateur'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Plan Basic
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-background">
                                {user?.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 mt-2 p-2 bg-card/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl">
                        <DropdownMenuLabel className="font-normal p-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-foreground">Mon Compte</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-primary/10 p-3">
                            <User className="mr-2 h-4 w-4 text-primary" />
                            <span>Profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-primary/10 p-3">
                            <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
                            <span>Facturation</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-primary/10 p-3">
                            <Settings className="mr-2 h-4 w-4 text-blue-500" />
                            <span>Paramètres</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-red-500/10 text-red-500 focus:text-red-500 p-3" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Se déconnecter</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
