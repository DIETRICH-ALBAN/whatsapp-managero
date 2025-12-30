'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Search, User, CreditCard, Settings, LogOut, X, Inbox } from 'lucide-react'
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
import { cn } from '@/lib/utils'

export function Header({ user }: { user: any }) {
    const router = useRouter()
    const [showNotifications, setShowNotifications] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Recherche globale
    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }
        setSearching(true)
        try {
            const supabase = createClient()
            // Recherche dans les conversations
            const { data: convos } = await supabase
                .from('conversations')
                .select('id, contact_name, contact_phone, last_message')
                .or(`contact_name.ilike.%${query}%,contact_phone.ilike.%${query}%,last_message.ilike.%${query}%`)
                .limit(5)
            setSearchResults(convos || [])
        } catch (err) {
            console.error('Search error:', err)
        } finally {
            setSearching(false)
        }
    }

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30">

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher une conversation..."
                    className="pl-10 bg-muted border-input focus:ring-primary rounded-full h-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {/* Résultats de recherche */}
                {searchQuery.length >= 2 && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                        {searching ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">Recherche...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">Aucun résultat</div>
                        ) : (
                            searchResults.map((r) => (
                                <div
                                    key={r.id}
                                    className="p-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-0"
                                    onClick={() => { router.push('/dashboard/messages'); setSearchQuery(''); }}
                                >
                                    <p className="font-medium text-sm">{r.contact_name || r.contact_phone}</p>
                                    <p className="text-xs text-muted-foreground truncate">{r.last_message}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
                    </button>

                    {/* Panel Notifications */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h4 className="font-bold text-sm">Notifications</h4>
                                <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
                                <Inbox className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm font-medium">Aucune notification</p>
                                <p className="text-xs mt-1">Vous êtes à jour !</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-border mx-1 md:mx-2 hidden sm:block" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 md:gap-3 outline-none">
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
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-primary/10 p-3" onClick={() => router.push('/dashboard/settings')}>
                            <User className="mr-2 h-4 w-4 text-primary" />
                            <span>Profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-primary/10 p-3" onClick={() => router.push('/dashboard/billing')}>
                            <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
                            <span>Facturation</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl focus:bg-primary/10 p-3" onClick={() => router.push('/dashboard/settings')}>
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
