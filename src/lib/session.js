import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSession(userId) {
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

  const { data, error } = await supabase
    .from('user_youtube_credentials')
    .select('access_token, refresh_token, expiry_date')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return { tokens: data };
}

