import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Refresh session if it exists
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // Auth routes that should redirect if already logged in
    const authRoutes = ['/login', '/register']
    const isAuthRoute = authRoutes.includes(pathname)

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if accessing auth routes while logged in
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
