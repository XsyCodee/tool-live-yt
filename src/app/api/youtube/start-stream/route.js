import { google } from 'googleapis';
import { getSession } from '@/lib/session';
import { getUserOAuthClient } from '@/lib/oauth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, broadcastId, streamId } = body;

    if (!userId || !broadcastId || !streamId) {
      return Response.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const session = await getSession(userId);
    if (!session || !session.tokens) {
      return Response.json({ success: false, message: 'User session not found.' }, { status: 401 });
    }

    const oauth2Client = await getUserOAuthClient(session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Tunggu sampai stream menjadi aktif
    let attempts = 0;
    const maxAttempts = 10;
    const waitTime = 3000;
    let streamStatus = '';

    while (attempts < maxAttempts) {
      const streamStatusRes = await youtube.liveStreams.list({
        part: ['status'],
        id: [streamId],
      });

      streamStatus = streamStatusRes?.data?.items?.[0]?.status?.streamStatus;
      console.log(`Check stream status [${attempts + 1}]:`, streamStatus);

      if (streamStatus === 'active') break;

      await new Promise((res) => setTimeout(res, waitTime));
      attempts++;
    }

    if (streamStatus !== 'active') {
      return Response.json(
        { success: false, message: 'Stream did not become active in time.' },
        { status: 403 }
      );
    }

    // Cek lifecycle status broadcast saat ini
    const broadcastRes = await youtube.liveBroadcasts.list({
      part: ['status'],
      id: [broadcastId],
    });

    const currentStatus = broadcastRes?.data?.items?.[0]?.status?.lifeCycleStatus;
    console.log('📺 Broadcast current status:', currentStatus);

    // Transisi ke testing jika masih ready
    if (currentStatus === 'ready') {
      console.log('🔁 Transitioning from READY → TESTING...');
      await youtube.liveBroadcasts.transition({
        broadcastStatus: 'testing',
        id: broadcastId,
        part: ['status'],
      });

      // Delay agar transisi berhasil
      await new Promise((res) => setTimeout(res, 5000));
    }

    // Transisi ke live
    console.log('🚀 Transitioning from TESTING → LIVE...');
    await youtube.liveBroadcasts.transition({
      broadcastStatus: 'live',
      id: broadcastId,
      part: ['status'],
    });

    console.log('✅ Broadcast transitioned to LIVE.');
    return Response.json({ success: true, message: 'Broadcast transitioned to LIVE.' });

  } catch (err) {
    console.error('start-stream error:', err);
    return Response.json({ success: false, message: err?.message || 'Unexpected error.' }, { status: 500 });
  }
}

