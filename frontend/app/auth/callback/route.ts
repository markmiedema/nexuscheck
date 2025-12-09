import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth callback handler for Supabase authentication flows:
 * - OAuth sign-in (Google, Microsoft)
 * - Password reset links
 * - Email confirmation links
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error.message)
      // Redirect to login with error message
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
  }

  // Redirect to the specified destination (or /dashboard by default)
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
