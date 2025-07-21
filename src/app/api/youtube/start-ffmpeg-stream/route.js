// src/app/api/youtube/start-ffmpeg-stream/route.js

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(request) {
  try {
    const {
      userId,
      videoPublicUrl,
      rtmpUrl,
      streamKey,
      streamResolution,
      broadcastId,
    } = await request.json();

    if (!userId || !videoPublicUrl || !rtmpUrl || !streamKey || !streamResolution || !broadcastId) {
      console.error('❌ Missing required stream details:', {
        userId,
        videoPublicUrl,
        rtmpUrl,
        streamKey,
        streamResolution,
        broadcastId,
      });
      return NextResponse.json({ success: false, message: 'Missing required stream details' }, { status: 400 });
    }

    const resolutionMap = {
      '1080p': '1920x1080',
      '720p': '1280x720',
      '480p': '854x480',
      '360p': '640x360',
    };

    const outputResolution = resolutionMap[streamResolution] || '1280x720';

    const ffmpegCommand = `ffmpeg -re -i "${videoPublicUrl}" -s ${outputResolution} -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ar 44100 -f flv "${rtmpUrl}"`;

    console.log('🚀 Starting FFmpeg with command:', ffmpegCommand);

    // Non-blocking execution (detached)
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ FFmpeg error:', error.message);
        return;
      }
      if (stderr) console.warn('⚠️ FFmpeg stderr:', stderr);
      if (stdout) console.log('✅ FFmpeg stdout:', stdout);
    });

    return NextResponse.json({ success: true, message: 'FFmpeg stream started.' });
  } catch (err) {
    console.error('❌ start-ffmpeg-stream error:', err.message);
    return NextResponse.json({ success: false, message: err.message || 'Unknown server error.' }, { status: 500 });
  }
}

