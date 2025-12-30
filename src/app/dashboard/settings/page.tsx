'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, User, Bell, Shield, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState({
        full_name: '',
        phone: '',
        company: ''
    })
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    })

    const { theme, setTheme } = useTheme()
    const supabase = createClient()

    useEffect(() => {
        fetchUser()
    }, [])

    const fetchUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                setProfile({
                    full_name: user.user_metadata?.full_name || '',
                    phone: user.user_metadata?.phone || '',
                    company: user.user_metadata?.company || ''
                })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: profile.full_name,
                    phone: profile.phone,
                    company: profile.company
                }
            })
            if (error) throw error
            toast.success('Profil mis à jour !')
        } catch (err: any) {
            toast.error(err.message || 'Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-8 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold">Paramètres</h1>
                <p className="text-muted-foreground">Gérez votre compte et vos préférences.</p>
            </div>

            {/* Profil */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Informations personnelles</CardTitle>
                            <CardDescription>Vos informations de profil</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nom complet</Label>
                            <Input
                                value={profile.full_name}
                                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                placeholder="Jean Dupont"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ''} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone</Label>
                            <Input
                                value={profile.phone}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+237 6 00 00 00 00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Entreprise</Label>
                            <Input
                                value={profile.company}
                                onChange={e => setProfile({ ...profile, company: e.target.value })}
                                placeholder="Ma Société SARL"
                            />
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="mt-4">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Enregistrer
                    </Button>
                </CardContent>
            </Card>

            {/* Apparence */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </div>
                        <div>
                            <CardTitle>Apparence</CardTitle>
                            <CardDescription>Personnalisez l'interface</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div>
                            <p className="font-medium">Mode sombre</p>
                            <p className="text-sm text-muted-foreground">Activer le thème sombre</p>
                        </div>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Gérez comment vous êtes notifié</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div>
                            <p className="font-medium">Notifications Email</p>
                            <p className="text-sm text-muted-foreground">Recevoir des alertes par email</p>
                        </div>
                        <Switch checked={notifications.email} onCheckedChange={v => setNotifications({ ...notifications, email: v })} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div>
                            <p className="font-medium">Notifications Push</p>
                            <p className="text-sm text-muted-foreground">Notifications dans le navigateur</p>
                        </div>
                        <Switch checked={notifications.push} onCheckedChange={v => setNotifications({ ...notifications, push: v })} />
                    </div>
                </CardContent>
            </Card>

            {/* Sécurité */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Sécurité</CardTitle>
                            <CardDescription>Gérez la sécurité de votre compte</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full justify-start">
                        Changer le mot de passe
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
