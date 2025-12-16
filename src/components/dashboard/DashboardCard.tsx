'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MotionCard } from '@/lib/animations'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    variant?: 'default' | 'glass' | 'gradient' | 'elevated'
    delay?: number
}

export function DashboardCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = 'elevated',
    delay = 0,
}: DashboardCardProps) {
    return (
        <MotionCard delay={delay}>
            <Card variant={variant} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
                        {title}
                    </CardTitle>
                    {Icon && (
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                            <Icon className="h-4 w-4 text-indigo-500" />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gradient">{value}</div>
                    {description && (
                        <CardDescription className="mt-1">{description}</CardDescription>
                    )}
                    {trend && (
                        <div className="flex items-center mt-2 text-sm">
                            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="ml-2 text-slate-500">vs période précédente</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </MotionCard>
    )
}
