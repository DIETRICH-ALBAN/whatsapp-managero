'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    ShoppingBag, Search, Plus, Package,
    Clock, CheckCircle, XCircle, Loader2, Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Order {
    id: string
    customer_name: string
    customer_phone: string
    total_amount: number
    currency: string
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
    created_at: string
    items?: any[]
}

export default function OrdersPage() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setOrders(data)
        } catch (err) {
            console.error('Error fetching orders:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>
            case 'confirmed': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Package className="w-3 h-3 mr-1" /> Confirmée</Badge>
            case 'delivered': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Livrée</Badge>
            case 'cancelled': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Annulée</Badge>
            default: return <Badge>{status}</Badge>
        }
    }

    const filteredOrders = orders.filter(o => {
        if (filter !== 'all' && o.status !== filter) return false
        if (searchQuery && !o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !o.customer_phone?.includes(searchQuery)) return false
        return true
    })

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Commandes</h1>
                    <p className="text-muted-foreground">Gérez les commandes de vos clients.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle commande
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un client..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className={cn(filter === f && 'bg-indigo-600')}
                        >
                            {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : f === 'confirmed' ? 'Confirmées' : f === 'delivered' ? 'Livrées' : 'Annulées'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <h3 className="font-bold text-lg mb-2">Aucune commande</h3>
                        <p className="text-muted-foreground">Les commandes de vos clients apparaîtront ici.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <ShoppingBag className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Commande #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-muted-foreground">{order.customer_name || order.customer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {getStatusBadge(order.status)}
                                        <div className="text-right">
                                            <p className="font-bold">{Number(order.total_amount).toLocaleString()} {order.currency}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
