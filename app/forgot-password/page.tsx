"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (requestError) {
      setError("We couldn’t send a reset email. Check the address and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand" href="/">plunge</Link>
        <h1>Reset your password</h1>
        {sent ? (
          <>
            <p>If an account exists for that address, a password reset email is on its way.</p>
            <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
          </>
        ) : (
          <>
            <p>Enter your email and we’ll send you a secure reset link.</p>
            <form onSubmit={submit}>
              <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button type="submit" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
            </form>
            <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
