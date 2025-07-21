// src/app/api/youtube/transition-to-live/route.js

import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, broadcastId } = await request.json();

    if (!userId || !broadcastId) {
      return NextResponse.json({ success: false, message: 'Missing userId or broadcastId' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          async get(name) {
            return (await cookies().get(name))?.value;
          },
          set(name, value, options) {
            cookies().set(name, value, options);
          },
          remove(name, options) {
            cookies().set(name, '', options);
          },
        },
      }
    );

    const { data: creds } = await supabase
      .from('user_youtube_credentials')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();

    if (!creds) {
      return NextResponse.json({ success: false, message: 'YouTube credentials not found.' }, { status: 401 });
    }

    oauth2Client.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: new Date(creds.expiry_date).getTime(),
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Transition to LIVE
    const transitionRes = await youtube.liveBroadcasts.transition({
      part: 'status',
      id: broadcastId,
      broadcastStatus: 'live',
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast ${broadcastId} transitioned to LIVE.`,
      transitionResult: transitionRes.data,
    });

  } catch (err) {
    console.error('Transition error:', err.message);
    return NextResponse.json({
      success: false,
      message: err.message || 'Unknown error during transition to live.',
    }, { status: 500 });
  }
}

