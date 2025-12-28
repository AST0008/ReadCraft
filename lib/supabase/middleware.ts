import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, skip Supabase operations (e.g., during build)
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, just return the response without auth checks
    // This allows static generation to proceed
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (request.nextUrl.pathname === '/' && user) {
      // Optional: Redirect logged in users to dashboard
      // return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    // If there's an error (e.g., during build), just continue
    // The page will handle authentication on the client side
    console.error('Supabase auth error in middleware:', error)
  }

  return response
}
