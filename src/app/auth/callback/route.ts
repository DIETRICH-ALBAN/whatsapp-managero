import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    // Utiliser NEXT_PUBLIC_SITE_URL pour la redirection finale
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (code) {
        const cookieStore = await cookies()

        // Créer la réponse de redirection EN PREMIER
        const redirectUrl = new URL(next, siteUrl)
        const response = NextResponse.redirect(redirectUrl)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        // Écrire les cookies directement sur la RÉPONSE
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response // Retourne la réponse AVEC les cookies
        }

        console.error('Auth callback error:', error.message)
    }

    // Retourne l'utilisateur vers une page d'erreur
    return NextResponse.redirect(new URL('/auth/auth-code-error', siteUrl))
}
