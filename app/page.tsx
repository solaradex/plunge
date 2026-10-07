export default function Home() {
  return (
    <main className="landing">
      <section className="hero">
        <h1 className="logo">plunge</h1>
        <p className="tagline">
          Meet people nearby. Chat. Make friends. Find your connection.
        </p>

        <div className="actions">
          <a className="button primary" href="/signup">Create account</a>
          <a className="button secondary" href="/login">Log in</a>
        </div>

        <p className="note">Plunge is for adults 18+.</p>
      </section>
    </main>
  );
}
