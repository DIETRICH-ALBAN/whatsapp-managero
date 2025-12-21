'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Smartphone,
    QrCode,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    Unplug,
    Wifi,
    WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected'

interface SessionInfo {
    status: ConnectionStatus
    qrCode?: string
    phoneNumber?: string
    savedSession?: {
        wasConnected: boolean
        phoneNumber: string | null
        lastConnected: string | null
    }
}

export default function WhatsAppSettingsPage() {
    const [session, setSession] = useState<SessionInfo>({ status: 'disconnected' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Polling pour le statut
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp/connect')
            if (res.ok) {
                const data = await res.json()
                setSession(data)
            }
        } catch (err) {
            console.error('Erreur fetch status:', err)
        }
    }, [])

    useEffect(() => {
        fetchStatus()

        // Polling plus fréquent quand on attend le QR ou la connexion
        const interval = setInterval(fetchStatus,
            session.status === 'connecting' || session.status === 'qr_ready' ? 2000 : 10000
        )

        return () => clearInterval(interval)
    }, [fetchStatus, session.status])

    const handleConnect = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/whatsapp/connect', { method: 'POST' })

            if (!res.ok) {
                throw new Error('Échec de la connexion')
            }

            const data = await res.json()
            setSession(data)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        setLoading(true)

        try {
            await fetch('/api/whatsapp/connect', { method: 'DELETE' })
            setSession({ status: 'disconnected' })
        } catch (err) {
            setError('Échec de la déconnexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Connexion WhatsApp</h1>
                <p className="text-muted-foreground">
                    Connectez votre compte WhatsApp personnel pour accéder à vos conversations.
                </p>
            </div>

            {/* Status Card */}
            <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        session.status === 'connected'
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                    )}>
                        {session.status === 'connected' ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground">Statut de connexion</h2>
                        <p className={cn(
                            "text-sm",
                            session.status === 'connected' ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                            {session.status === 'connected' && `Connecté (${session.phoneNumber})`}
                            {session.status === 'qr_ready' && 'En attente du scan...'}
                            {session.status === 'connecting' && 'Connexion en cours...'}
                            {session.status === 'disconnected' && 'Non connecté'}
                        </p>
                    </div>
                </div>

                {/* QR Code Display */}
                <AnimatePresence mode="wait">
                    {session.status === 'qr_ready' && session.qrCode && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center py-8"
                        >
                            <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
                                <img
                                    src={session.qrCode}
                                    alt="QR Code WhatsApp"
                                    className="w-64 h-64"
                                />
                            </div>
                            <div className="text-center max-w-sm">
                                <h3 className="font-semibold text-foreground mb-2">Scannez ce QR Code</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ouvrez WhatsApp sur votre téléphone → Paramètres → Appareils connectés → Lier un appareil
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                className="mt-4 text-muted-foreground"
                                onClick={handleConnect}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Actualiser le QR Code
                            </Button>
                        </motion.div>
                    )}

                    {session.status === 'connecting' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center py-12"
                        >
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Génération du QR Code...</p>
                        </motion.div>
                    )}

                    {session.status === 'connected' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center py-8"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Connecté avec succès !</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Votre compte WhatsApp est maintenant lié à Vibe.
                            </p>
                            <Button
                                variant="outline"
                                className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                                onClick={handleDisconnect}
                                disabled={loading}
                            >
                                <Unplug className="w-4 h-4 mr-2" />
                                Déconnecter
                            </Button>
                        </motion.div>
                    )}

                    {session.status === 'disconnected' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center py-8"
                        >
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <Smartphone className="w-10 h-10 text-muted-foreground" />
                            </div>

                            {session.savedSession?.wasConnected && (
                                <p className="text-sm text-muted-foreground mb-4">
                                    Dernière connexion : {session.savedSession.phoneNumber}
                                </p>
                            )}

                            <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={handleConnect}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <QrCode className="w-4 h-4 mr-2" />
                                )}
                                Connecter mon WhatsApp
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                    >
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-500">{error}</p>
                    </motion.div>
                )}
            </Card>

            {/* Instructions */}
            <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold text-foreground mb-4">Comment ça marche ?</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">1</span>
                        <span>Cliquez sur "Connecter mon WhatsApp" pour générer un QR Code unique.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">2</span>
                        <span>Ouvrez WhatsApp sur votre téléphone et allez dans Paramètres → Appareils connectés.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">3</span>
                        <span>Scannez le QR Code affiché à l'écran.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">4</span>
                        <span>Une fois connecté, vos messages apparaîtront automatiquement dans la section Messages.</span>
                    </li>
                </ol>
            </Card>
        </div>
    )
}
