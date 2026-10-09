"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else window.location.href = "/onboarding";
    setLoading(false);
  }

  return <main className="auth-page"><section className="auth-card"><Link className="brand" href="/">plunge</Link><h1>Welcome back</h1><p>Sign in and get back to meeting people nearby.</p><form onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <div className="form-error">{error}</div>}<button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form><p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p><p className="auth-switch">New to Plunge? <Link href="/signup">Create an account</Link></p></section></main>;
}
