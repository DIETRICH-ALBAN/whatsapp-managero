'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

interface LogoProps {
    size?: 'sm' | 'md' | 'lg'
    href?: string
    className?: string
}

export function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
    const sizes = {
        sm: { icon: 28, text: 'text-lg', bubble: 10 },
        md: { icon: 36, text: 'text-xl', bubble: 12 },
        lg: { icon: 48, text: 'text-2xl', bubble: 14 },
    }

    const s = sizes[size]

    const LogoContent = (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Icon: Stylized W with chat bubble */}
            <div className="relative">
                {/* The W Shape */}
                <svg
                    width={s.icon}
                    height={s.icon * 0.85}
                    viewBox="0 0 48 41"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Left chevron */}
                    <path
                        d="M0 0L12 20.5L0 41H10L22 20.5L10 0H0Z"
                        fill="url(#gradient1)"
                    />
                    {/* Right chevron (darker) */}
                    <path
                        d="M16 0L28 20.5L16 41H26L38 20.5L26 0H16Z"
                        fill="url(#gradient2)"
                    />
                    <defs>
                        <linearGradient id="gradient1" x1="0" y1="0" x2="22" y2="41" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#8B5CF6" />
                            <stop offset="1" stopColor="#6366F1" />
                        </linearGradient>
                        <linearGradient id="gradient2" x1="16" y1="0" x2="38" y2="41" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#6366F1" />
                            <stop offset="1" stopColor="#4F46E5" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Chat bubble badge */}
                <div
                    className="absolute -top-1 -right-1 bg-indigo-600 rounded-md flex items-center justify-center shadow-lg"
                    style={{ width: s.bubble + 4, height: s.bubble + 4 }}
                >
                    <MessageCircle
                        className="text-white"
                        style={{ width: s.bubble - 2, height: s.bubble - 2 }}
                        strokeWidth={2.5}
                    />
                </div>
            </div>

            {/* Text: vibevendor */}
            <span className={`font-bold tracking-tight ${s.text}`}>
                <span className="text-white">vibe</span>
                <span className="text-indigo-400">vendor</span>
            </span>
        </div>
    )

    if (href) {
        return (
            <Link href={href} className="flex items-center hover:opacity-90 transition-opacity">
                {LogoContent}
            </Link>
        )
    }

    return LogoContent
}
