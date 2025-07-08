// src/components/Sections/AccountSettingsSection.jsx

import React, { useState, useEffect } from 'react';
// PERBAHAN: Ganti Link dan LinkOff dengan Check dan X
import { Youtube, Check, X } from 'lucide-react'; // <<< UBAH BARIS INI
import { supabase } from '@/lib/supabaseclient';

const AccountSettingsSection = () => {
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [channelName, setChannelName] = useState("Belum Terhubung");
  const [connectionDate, setConnectionDate] = useState(null);
  const [loadingConnectionStatus, setLoadingConnectionStatus] = useState(true);

  // Kredensial Google API dari Environment Variables (aman karena ini client-side render)
  // Pastikan ini dimulai dengan NEXT_PUBLIC_
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI; // Contoh: http://localhost:3000/api/youtube-auth-callback

  // Fungsi untuk memulai alur otorisasi YouTube OAuth
  const handleConnectYouTube = () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      alert('Kredensial Google API (NEXT_PUBLIC_GOOGLE_CLIENT_ID atau NEXT_PUBLIC_GOOGLE_REDIRECT_URI) belum diatur dengan benar di environment variables Anda.');
      return;
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload', // Untuk mengunggah video
      'https://www.googleapis.com/auth/youtube.force-ssl', // Untuk keamanan
      'https://www.googleapis.com/auth/youtube', // Untuk kontrol penuh
      'https://www.googleapis.com/auth/youtube.readonly', // Untuk membaca info channel
    ];

    const authUrl = `${rootUrl}?` + new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Penting untuk mendapatkan refresh_token
      prompt: 'consent', // Minta user untuk selalu memberikan consent
      include_granted_scopes: 'true', // Untuk melihat scope yang sudah diberikan
    }).toString();

    window.location.href = authUrl;
  };

  // Fungsi untuk memutuskan koneksi YouTube (akan menghapus token dari DB)
  const handleDisconnectYouTube = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan akun YouTube Anda?")) {
      return;
    }
    setLoadingConnectionStatus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Anda tidak terautentikasi.");
        setLoadingConnectionStatus(false);
        return;
      }
      const { error } = await supabase
        .from('user_youtube_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error("Error disconnecting YouTube account:", error.message);
        alert("Gagal memutuskan akun YouTube: " + error.message);
      } else {
        setYoutubeConnected(false);
        setChannelName("Belum Terhubung");
        setConnectionDate(null);
        alert("Akun YouTube berhasil diputuskan.");
      }
    } catch (error) {
      console.error("Error during disconnect:", error.message);
      alert("Terjadi kesalahan saat memutuskan akun YouTube.");
    } finally {
      setLoadingConnectionStatus(false);
    }
  };

  // Cek status koneksi YouTube saat komponen dimuat
  useEffect(() => {
    const checkYoutubeConnection = async () => {
      setLoadingConnectionStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingConnectionStatus(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_youtube_credentials')
        .select('created_at') // Atau select nama channel jika Anda menyimpannya
        .eq('user_id', user.id)
        .single();

      if (data) {
        setYoutubeConnected(true);
        // Untuk nama channel, Anda mungkin perlu menyimpan 'user_metadata' dari YouTube API
        // atau melakukan panggilan API YouTube terpisah untuk mendapatkan nama channel
        setChannelName("Nama Channel Anda (Terhubung)"); 
        setConnectionDate(new Date(data.created_at).toLocaleDateString());
      } else if (error && error.code !== 'PGRST116') { // PGRST116 adalah error "tidak ditemukan"
        console.error("Error checking YouTube connection:", error.message);
      }
      setLoadingConnectionStatus(false);
    };

    checkYoutubeConnection();

    // Handle redirect dari Google OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.has('youtube_auth') && params.get('youtube_auth') === 'success') {
      alert("Akun YouTube berhasil dihubungkan!");
      // Hapus parameter dari URL agar tidak muncul lagi saat refresh
      params.delete('youtube_auth');
      window.history.replaceState({}, document.title, "?" + params.toString());
    } else if (params.has('error') && params.get('error').includes('auth')) {
        alert("Gagal menghubungkan akun YouTube. Mohon coba lagi.");
        params.delete('error');
        window.history.replaceState({}, document.title, "?" + params.toString());
    }
  }, []); // Hanya berjalan sekali saat komponen dimuat

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Akun</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="font-semibold text-lg text-gray-800 mb-4">Informasi Profil</h4>
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100 cursor-not-allowed" value="youtuber@example.com" disabled />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" id="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" value="********" readOnly />
            <button className="mt-2 text-purple-600 hover:underline text-sm">Ganti Password</button>
          </div>
        </div>

        <h4 className="font-semibold text-lg text-gray-800 mb-4">Akun YouTube Terhubung</h4>
        {loadingConnectionStatus ? (
          <p className="text-gray-600 text-sm">Memeriksa status koneksi YouTube...</p>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
            <div className="flex items-center">
              <Youtube size={30} className={youtubeConnected ? "text-red-500 mr-3" : "text-gray-400 mr-3"} />
              <div>
                <p className="font-medium text-gray-800">{channelName}</p>
                {youtubeConnected && <p className="text-sm text-gray-500">Terhubung sejak {connectionDate}</p>}
              </div>
            </div>
            {youtubeConnected ? (
              <button
                onClick={handleDisconnectYouTube}
                className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center"
              >
                <X size={16} className="mr-2" /> Putuskan Akun {/* <<< GUNAKAN IKON X */}
              </button>
            ) : (
              <button
                onClick={handleConnectYouTube}
                className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center"
              >
                <Check size={16} className="mr-2" /> Hubungkan Akun YouTube {/* <<< GUNAKAN IKON CHECK */}
              </button>
            )}
          </div>
        )}

        <h4 className="font-semibold text-lg text-gray-800 mb-4">Detail Paket</h4>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Paket Saat Ini: <span className="text-purple-600 font-bold">Pro Streamer</span></p>
            <p className="text-sm text-gray-500">Berakhir pada 2026-06-01</p>
          </div>
          <button className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-semibold">
            Upgrade Paket
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsSection;