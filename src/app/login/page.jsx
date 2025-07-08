'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { handleLogin, handleRegister } from "@/lib/auth/handleLogin";
import { supabase } from "@/lib/supabaseclient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("Password dan konfirmasi tidak cocok");
      setLoading(false);
      return;
    }

    try {
      const { error } = isLogin
        ? await handleLogin(email, password)
        : await handleRegister(email, password);

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("Email atau password salah, atau akun belum terdaftar.");
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      router.push("/handle-manual-login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/handle-google-login`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="space-y-6 p-8">
          <h2 className="text-2xl font-bold text-center">
            {isLogin ? "Masuk ke Akun Anda" : "Daftar Akun Baru"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isLogin && (
              <Input
                placeholder="Konfirmasi Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : isLogin ? "Login" : "Daftar"}
            </Button>
            {isLogin && (
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={loginWithGoogle}
              >
                Login dengan Google
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-gray-500">
            {isLogin ? (
              <>
                Belum punya akun?{" "}
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => router.push("/register")}
                >
                  Daftar di sini
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => setIsLogin(true)}
                >
                  Login di sini
                </button>
              </>
            )}
            <div className="mt-2">
              <a href="#" className="text-blue-500 hover:underline">
                Lupa Password?
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
