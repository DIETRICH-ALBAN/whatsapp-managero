'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                router.push('/login')
                return
            }
            setUser(user)
            setLoading(false)
        }
        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] dark:bg-[#0B0B0F] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#0B0B0F]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header user={user} />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
