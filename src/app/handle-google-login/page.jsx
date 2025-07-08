'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';

export default function HandleGoogleLogin() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log("User belum login, redirect ke /login");
        return router.push('/login');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profile) {
        console.log("Punya profil, ke dashboard");
        router.push('/dashboard');
      } else {
        console.log("Belum punya profil, ke /oauth");
        router.push('/oauth');
      }
    };

    checkUser();
  }, [router]);

  return (
    <p className="text-center p-8">Mendeteksi akun dan mengalihkan...</p>
  );
}
