"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/onboarding` } });
    if (error) setError(error.message);
    else if (data.session) window.location.href = "/onboarding";
    else setMessage("Account created. Check your email to confirm your address, then continue to onboarding.");
    setLoading(false);
  }

  return <main className="auth-page"><section className="auth-card"><Link className="brand" href="/">plunge</Link><h1>Join Plunge</h1><p>Create your account and meet people nearby.</p><form onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></label><label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" /></label>{error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}<button type="submit" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button></form><p className="age-note">Plunge is for adults 18+.</p><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></section></main>;
}
