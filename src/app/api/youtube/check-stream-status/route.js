import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req) {
  const { streamId } = await req.json();
  if (!streamId) return NextResponse.json({ error: "streamId is required" }, { status: 400 });

  // Ambil kredensial YouTube user dari Supabase
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

  const { data: creds, error } = await supabase
    .from("user_youtube_credentials")
    .select("*")
    .single();

  if (error || !creds) {
    return NextResponse.json({ error: "YouTube credentials not found." }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: creds.access_token,
    refresh_token: creds.refresh_token,
    expiry_date: new Date(creds.expiry_date).getTime(),
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    const res = await youtube.liveStreams.list({
      part: 'status',
      id: streamId,
    });

    const status = res.data.items[0]?.status?.streamStatus || "unknown";
    return NextResponse.json({ status }, { status: 200 });
  } catch (err) {
    console.error("Error checking stream status:", err.message);
    return NextResponse.json({ error: "Failed to check stream status." }, { status: 500 });
  }
}

