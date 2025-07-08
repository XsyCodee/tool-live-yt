// src/app/api/youtube/create-live-broadcast/route.js

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Kredensial OAuth dari Environment Variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export async function POST(request) {
  try {
    const { userId, streamTitle, streamDescription, streamVisibility, scheduledDateTime, streamResolution } = await request.json();

    if (!userId || !streamTitle || !streamDescription || !streamVisibility || !scheduledDateTime || !streamResolution) {
      return NextResponse.json({ success: false, message: 'Missing required stream details (userId, title, description, visibility, scheduledDateTime, streamResolution).' }, { status: 400 });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.error("Missing Google API environment variables.");
      return NextResponse.json({ success: false, message: 'Server configuration error: Google API credentials are not set.' }, { status: 500 });
    }

    const supabaseServer = createServerClient(
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

    const { data: userCredentials, error: dbError } = await supabaseServer
      .from('user_youtube_credentials')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();

    if (dbError || !userCredentials) {
      console.error("Error fetching user YouTube credentials:", dbError?.message || "Credentials not found.");
      return NextResponse.json({ success: false, message: 'User YouTube credentials not found or invalid. Please connect your YouTube account first.' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: userCredentials.access_token,
      refresh_token: userCredentials.refresh_token,
      expiry_date: new Date(userCredentials.expiry_date).getTime(),
    });

    const now = Date.now();
    const expiryDate = new Date(userCredentials.expiry_date).getTime();
    const isExpired = expiryDate < now + (60 * 1000);

    if (isExpired && userCredentials.refresh_token) {
      console.log("YouTube access token expired or near expiry, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();
      const { error: updateError } = await supabaseServer.from('user_youtube_credentials')
        .update({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || userCredentials.refresh_token,
          scope: credentials.scope || userCredentials.scope,
          token_type: credentials.token_type || userCredentials.token_type,
          expiry_date: new Date(credentials.expiry_date).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("Error updating refreshed YouTube tokens to DB:", updateError.message);
      }
      oauth2Client.setCredentials(credentials);
      console.log("YouTube access token refreshed and updated in DB.");
    } else if (!userCredentials.refresh_token) {
        console.warn("No refresh token available for user. Cannot refresh access token automatically.");
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const broadcastResponse = await youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title: streamTitle,
          description: streamDescription,
          scheduledStartTime: new Date(scheduledDateTime).toISOString(),
        },
        status: {
          privacyStatus: streamVisibility,
        },
        contentDetails: {
          enableDvr: true,
          enableContentEncryption: false,
          enableEmbed: true,
          recordFromStart: true,
          enableLowLatency: false,
        },
      },
    });

    const broadcastId = broadcastResponse.data.id;
    const broadcastStatus = broadcastResponse.data.status.lifeCycleStatus;
    console.log(`YouTube Broadcast created: ${broadcastId}, Status: ${broadcastStatus}`);

    const streamResponse = await youtube.liveStreams.insert({
      part: ['snippet', 'cdn'],
      requestBody: {
        snippet: {
          title: `Stream Data for: ${streamTitle}`,
          description: `Live stream data for broadcast ID: ${broadcastId}`,
        },
        cdn: {
          frameRate: '30fps',
          ingestionType: 'rtmp',
          resolution: streamResolution,
        },
      },
    });

    const streamId = streamResponse.data.id;
    let rtmpUrl = streamResponse.data.cdn.ingestionInfo.ingestionAddress;
    const streamKey = streamResponse.data.cdn.ingestionInfo.streamName;

    // --- MULAI PERBAIKAN DI SINI ---
    // YouTube API seharusnya memberikan RTMP URL dalam format yang benar (mis. rtmp://a.rtmp.youtube.com/live2).
    // Jika log Anda menunjukkan 'rtmp://a.rtmp.youtube.com/live2',
    // itu sangat tidak biasa dan mungkin ada masalah di sisi YouTube atau interpretasi log.
    // Namun, jika formatnya memang konsisten seperti itu dan menyebabkan masalah,
    // kita bisa coba membersihkannya:
    if (rtmpUrl.startsWith('rtmp://http://')) {
        // Hapus bagian 'http://' yang tidak perlu jika ada kesalahan format seperti ini
        rtmpUrl = rtmpUrl.replace('rtmp://http://', 'rtmp://');
        console.warn(`WARN: Cleaned up malformed RTMP URL from YouTube API: ${rtmpUrl}`);
    }

    // Pastikan youtubeWatchUrl menggunakan format yang benar:
    const youtubeWatchUrl = `https://www.youtube.com/watch?v=${broadcastId}`;
    // --- AKHIR PERBAIKAN ---

    console.log(`YouTube Live Stream created: ${streamId}, Stream Key: ${streamKey}, RTMP URL: ${rtmpUrl}`);

    await youtube.liveBroadcasts.bind({
      part: ['id', 'contentDetails'],
      id: broadcastId,
      streamId: streamId,
    });
    console.log(`Live Stream ${streamId} bound to Broadcast ${broadcastId}`);

    return NextResponse.json({
      success: true,
      message: 'YouTube live broadcast and stream created successfully.',
      broadcastId: broadcastId,
      streamId: streamId,
      streamKey: streamKey,
      rtmpUrl: rtmpUrl, // Sekarang ini seharusnya menjadi URL RTMP yang bersih
      youtubeWatchUrl: youtubeWatchUrl, // URL nonton yang benar
    }, { status: 200 });

  } catch (error) {
    console.error("Error creating YouTube live broadcast:", error.message);
    if (error.response) {
      console.error("Google API Error Details:", error.response.data);
      return NextResponse.json({ success: false, message: `YouTube API Error: ${error.response.data.error.message || 'Unknown API error.'}`, details: error.response.data }, { status: error.response.status || 500 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create YouTube live broadcast. Please check server logs.', error: error.message }, { status: 500 });
  }
}