// src/app/api/youtube-auth-callback/route.js
// API Route ini menangani pengalihan balik dari Google OAuth
// setelah pengguna memberikan izin.

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers'; // Diperlukan untuk membaca/menulis cookies

// Kredensial OAuth dari Environment Variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const scope = url.searchParams.get('scope');

    // --- Konstruksi Base URL Secara Dinamis untuk Redirect ---
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // --- Inisialisasi Supabase Client di Sisi Server dengan Cookies ---
    const cookieStore = cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          // PERBAIKAN KRITIS: Tambahkan 'await' di sini
          async get(name) { // Tambahkan 'async' ke fungsi get
            return (await cookieStore.get(name))?.value; // <<< TAMBAHKAN 'await' DI SINI
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    if (!code) {
      console.error("No authorization code received from Google.");
      return NextResponse.redirect(`${baseUrl}/dashboard?error=auth_failed`);
    }

    // --- Validasi Kredensial Environment di Sisi Server ---
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.error("Server configuration error: Missing Google API credentials in environment variables.");
      return NextResponse.redirect(`${baseUrl}/dashboard?error=server_config_error`);
    }

    // Inisialisasi OAuth2 Client Google
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    // --- Langkah 1: Tukar Kode Otorisasi dengan Token Akses dan Refresh Token ---
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      console.error("Failed to get all necessary tokens from Google:", tokens);
      return NextResponse.redirect(`${baseUrl}/dashboard?error=token_exchange_failed`);
    }

    // --- Langkah 2: Dapatkan ID Pengguna yang Sedang Login dari Supabase ---
    // Ini sekarang akan bekerja dengan lebih andal karena client cookies dibaca dengan await
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      console.error("User not authenticated for token storage (after Google OAuth):", userError?.message || "Auth session missing.");
      return NextResponse.redirect(`${baseUrl}/login?error=not_authenticated_after_google`);
    }

    // --- Langkah 3: Simpan Token Akses dan Refresh Token ke Database ---
    const { error: dbError } = await supabaseServer
      .from('user_youtube_credentials')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: scope || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: new Date(tokens.expiry_date).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error("Error saving YouTube tokens to DB:", dbError.message);
      return NextResponse.redirect(`${baseUrl}/dashboard?error=db_save_failed`);
    }

    console.log(`YouTube tokens successfully stored for user: ${user.id}`);
    return NextResponse.redirect(`${baseUrl}/dashboard?youtube_auth=success`);

  } catch (error) {
    console.error("Error in YouTube OAuth callback:", error.message);
    if (error.response) {
      console.error("Google API Error Details:", error.response.data);
    }
    const errorMessage = error.response?.data?.error_description || error.message;
    return NextResponse.redirect(`${baseUrl}/dashboard?error=${encodeURIComponent(errorMessage)}`);
  }
}