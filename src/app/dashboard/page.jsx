'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      // Optional: bisa tambahkan pengecekan profile juga
      setAllowed(true);
      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading) return <p className="text-center p-8">Memuat dashboard...</p>;

  return allowed ? <DashboardClient /> : null;
}
