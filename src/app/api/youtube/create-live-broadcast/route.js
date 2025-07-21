import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export async function POST(request) {
  try {
    const {
      userId,
      streamTitle,
      streamDescription,
      streamVisibility,
      scheduledDateTime,
      streamResolution,
    } = await request.json();

    if (!userId || !streamTitle || !streamDescription || !streamVisibility || !scheduledDateTime || !streamResolution) {
      return NextResponse.json({ success: false, message: 'Missing required stream details.' }, { status: 400 });
    }

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

    const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    oauth2.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: new Date(creds.expiry_date).getTime(),
    });

    const now = Date.now();
    if (creds.expiry_date && new Date(creds.expiry_date).getTime() < now + 60000) {
      const { credentials } = await oauth2.refreshAccessToken();
      await supabase.from('user_youtube_credentials').update({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || creds.refresh_token,
        expiry_date: new Date(credentials.expiry_date).toISOString(),
      }).eq('user_id', userId);
      oauth2.setCredentials(credentials);
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2 });

    // ✅ Tambahkan selfDeclaredMadeForKids
    const broadcast = await youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title: streamTitle,
          description: streamDescription,
          scheduledStartTime: new Date(scheduledDateTime).toISOString(),
        },
        status: {
          privacyStatus: streamVisibility,
          selfDeclaredMadeForKids: false, // 🔥 penting agar tidak gagal
        },
        contentDetails: {
          enableDvr: true,
          recordFromStart: true,
        },
      },
    });

    const stream = await youtube.liveStreams.insert({
      part: ['snippet', 'cdn'],
      requestBody: {
        snippet: {
          title: `Stream for ${streamTitle}`,
          description: `Live stream for broadcast ID: ${broadcast.data.id}`,
        },
        cdn: {
          frameRate: '30fps',
          ingestionType: 'rtmp',
          resolution: streamResolution,
        },
      },
    });

    await youtube.liveBroadcasts.bind({
      part: ['id', 'contentDetails'],
      id: broadcast.data.id,
      streamId: stream.data.id,
    });

    const ingestion = stream.data.cdn.ingestionInfo;
    const finalRtmpUrl = `${ingestion.ingestionAddress.replace(/\/$/, '')}/${ingestion.streamName}`;
    const youtubeWatchUrl = `https://www.youtube.com/watch?v=${broadcast.data.id}`;

    return NextResponse.json({
      success: true,
      broadcastId: broadcast.data.id,
      streamId: stream.data.id,
      rtmpUrl: finalRtmpUrl,
      streamKey: ingestion.streamName,
      youtubeWatchUrl,
    });
  } catch (error) {
    console.error('Create Broadcast Error:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Failed to create broadcast',
    }, { status: 500 });
  }
}

