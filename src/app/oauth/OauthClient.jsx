'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useRouter } from "next/navigation";

export default function OauthClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (data?.user) {
        setUserId(data.user.id);
        setUser(data.user);
      } else router.push("/login");
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Nama wajib diisi");
    if (!phone.trim()) return setError("Nomor WA wajib diisi");
    if (!/^[0-9+]{10,15}$/.test(phone)) return setError("Nomor WA tidak valid");

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: user?.email ?? "",
      name,
      phone,
      address,
      created_at: new Date().toISOString(),
    });

    if (error) setError(error.message);
    else router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-sm"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Identitas Pengguna</h2>
        <div className="mb-3">
          <label className="block text-sm text-gray-700 mb-1" htmlFor="name">
            Nama Lengkap
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Lengkap"
            required
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1" htmlFor="phone">
            Nomor WhatsApp
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nomor WhatsApp"
            required
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1" htmlFor="address">
            Alamat
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Alamat"
            required
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            value={user?.email ?? ""}
            readOnly
            className="border border-gray-300 bg-gray-100 rounded px-3 py-2 w-full text-sm cursor-not-allowed text-gray-500"
          />
        </div>
        {error && (
          <p className="text-red-500 text-xs text-center mb-2">{error}</p>
        )}
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded font-medium text-sm transition"
        >
          Simpan & Lanjut
        </button>
      </form>
    </div>
  );
}
