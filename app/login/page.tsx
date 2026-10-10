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
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError("We couldn’t sign you in with those details. Check your email and password, then try again.");
      } else {
        window.location.href = "/onboarding";
      }
    } catch {
      setError("Sign-in is temporarily unavailable. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card"><Link className="brand" href="/">plunge</Link><h1>Welcome back</h1><p>Sign in and get back to meeting people nearby.</p><form onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label>{error && <div className="form-error">{error}</div>}<button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form><p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p><p className="auth-switch">New to Plunge? <Link href="/signup">Create an account</Link></p></section></main>;
}
