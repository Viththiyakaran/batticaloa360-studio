"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    if (demo || !supabase) {
      setTimeout(() => router.push("/dashboard"), 450);
      return;
    }

    const result = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (result.error) return setError(result.error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#151713] p-4">
      <form className="card w-full max-w-md p-7" onSubmit={submit}>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f26a21] font-black text-white">B360</span>
          <div>
            <h1 className="text-xl font-black">Admin sign in</h1>
            <p className="text-sm text-[var(--muted)]">Batticaloa360 Content Studio</p>
          </div>
        </div>
        <label className="mb-1.5 block text-sm font-bold">Email</label>
        <input name="email" className="input mb-4" type="email" autoComplete="email" required />
        <label className="mb-1.5 block text-sm font-bold">Password</label>
        <input name="password" className="input mb-5" type="password" autoComplete="current-password" required />
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />}
          Sign in securely
        </button>
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          {demo ? "Development mode bypasses authentication." : "Supabase authentication is required."}
        </p>
      </form>
    </main>
  );
}
