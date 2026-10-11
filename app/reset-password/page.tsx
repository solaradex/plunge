"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password.length > 128) return setError("Use 128 characters or fewer.");
    if (password !== confirm) return setError("The entries do not match.");
    setLoading(true);
    try {
      const client = createClient();
      const { data, error: authError } = await client.auth.getUser();
      if (authError || !data.user) {
        setError("This link may have expired. Request a new one and open the latest email.");
        return;
      }
      const { error: saveError } = await client.auth.updateUser({ password });
      if (saveError) {
        setError("Could not update your credentials. Request a new reset link and try again.");
        return;
      }
      router.replace("/home");
    } catch {
      setError("Password reset is temporarily unavailable. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card">
    <Link className="brand" href="/">plunge</Link>
    <h1>Choose a new password</h1>
    <p>Use at least 8 characters and keep it unique to Plunge.</p>
    <form onSubmit={submit}>
      <label>New password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
      <label>Confirm password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button type="submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</button>
    </form>
    <p className="auth-switch"><Link href="/forgot-password">Request another reset link</Link></p>
  </section></main>;
}
