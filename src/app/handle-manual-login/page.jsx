'use client';
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useRouter } from "next/navigation";

export default function HandleManualLogin() {
  const router = useRouter();

  useEffect(() => {
    const verifyAccess = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // manual login tapi belum punya akun
        await supabase.auth.signOut();
        alert("Akun tidak ditemukan. Silakan registrasi.");
        return router.push("/login");
      }

      router.push("/dashboard");
    };

    verifyAccess();
  }, [router]);

  return <p className="text-center p-8">Memeriksa akun Anda...</p>;
}
