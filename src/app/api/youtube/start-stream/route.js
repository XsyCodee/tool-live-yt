// src/app/api/youtube/start-stream/route.js
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

// Variabel R2_PUBLIC_DOMAIN dari .env.local tidak lagi diperlukan di sini
// jika kita menggunakan videoPublicUrl yang dikirim dari frontend.
// const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN; // Hapus atau komentari baris ini

export async function POST(request) {
  try {
    // === PERBAIKAN UTAMA DI SINI ===
    // Pastikan videoPublicUrl di-destructure dari request.json()
    const { userId, videoStoragePath, rtmpUrl, streamKey, streamResolution, videoPublicUrl } = await request.json(); //

    // Validasi dasar, tambahkan videoPublicUrl
    if (!videoStoragePath || !rtmpUrl || !streamKey || !streamResolution || !videoPublicUrl) { //
      return NextResponse.json({ success: false, message: 'Missing FFmpeg stream details (videoStoragePath, rtmpUrl, streamKey, streamResolution, or videoPublicUrl).' }, { status: 400 }); //
    }

    // === PERBAIKAN UTAMA DI SINI ===
    // Gunakan videoPublicUrl yang sudah lengkap dan dikirim dari frontend.
    // Ini adalah URL yang sudah terbukti bisa di-curl dari VPS.
    const sourceVideoUrlForFfmpeg = videoPublicUrl; //

    // Hapus atau komentari konstruksi ulang yang lama jika ada di sini:
    // const videoPublicUrl = `${R2_PUBLIC_DOMAIN}/${videoStoragePath}`;

    console.log(`DEBUG (start-stream): videoPublicUrl received from frontend: ${videoPublicUrl}`); //
    console.log(`DEBUG (start-stream): Using this URL as FFmpeg input: ${sourceVideoUrlForFfmpeg}`); //

    // FFmpeg command (gunakan versi yang lebih lengkap dari diskusi sebelumnya)
    let scaleFilter = '';
    let videoBitrate = '4500k';

    if (streamResolution === '1080p') {
      scaleFilter = 'scale=1920:1080';
      videoBitrate = '8000k';
    } else if (streamResolution === '720p') {
      scaleFilter = 'scale=1280:720';
      videoBitrate = '4500k';
    } else if (streamResolution === '480p') {
      scaleFilter = 'scale=854:480';
      videoBitrate = '1500k';
    }

    const ffmpegArgs = [
      '-re',
      '-i', sourceVideoUrlForFfmpeg, // Menggunakan URL yang benar
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-b:v', videoBitrate,
      '-maxrate', `${parseInt(videoBitrate) + 500}k`,
      '-bufsize', `${parseInt(videoBitrate) * 2}k`,
      '-pix_fmt', 'yuv420p',
      '-g', '50',
      '-keyint_min', '50',
      '-sc_threshold', '0',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-f', 'flv',
      ...(scaleFilter ? ['-vf', scaleFilter] : []),
      `${rtmpUrl}/${streamKey}`
    ];

    console.log(`Starting FFmpeg for user ${userId} to stream ${sourceVideoUrlForFfmpeg} to ${rtmpUrl}/${streamKey}`); //
    console.log('FFmpeg Command Args:', ffmpegArgs.join(' ')); //

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { detached: true });

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
      if (code !== 0) {
        console.error(`FFmpeg streaming failed for user ${userId}. Exit code: ${code}`);
      } else {
        console.log(`FFmpeg streaming completed for user ${userId}.`);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error(`Failed to start FFmpeg process: ${err.message}`);
      if (err.code === 'ENOENT') {
        console.error('FFmpeg is not installed or not in your system\'s PATH.');
        console.error('Please install FFmpeg on your server where this Node.js application is running.');
      }
    });

    ffmpegProcess.unref();

    return NextResponse.json({ success: true, message: 'FFmpeg stream initiated successfully.' });

  } catch (error) {
    console.error("Error in /api/youtube/start-stream:", error.message);
    return NextResponse.json({ success: false, message: `Failed to initiate stream: ${error.message}` }, { status: 500 });
  }
}