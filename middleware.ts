// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  console.log('🧠 Session middleware:', session) // Debug: pastikan session terbaca

  return res
}

export const config = {
  matcher: [
    '/dashboard',
    '/oauth',
    '/handle-google-login',
    '/handle-manual-login',
  ],
}
