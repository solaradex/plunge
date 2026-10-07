export default function Home() {
  return (
    <main className="landing">
      <header className="landing-nav"><a className="brand" href="/"><img src="/plunge-mark.svg" alt="" />plunge</a><a href="/login" className="nav-login">Log in</a></header>
      <section className="hero">
        <div className="hero-badge">LOCAL • SOCIAL • REAL</div>
        <div className="hero-mark"><img src="/plunge-mark.svg" alt="Plunge" /></div>
        <h1 className="logo">plunge</h1>
        <p className="tagline">Meet nearby. Connect naturally.</p>
        <p className="hero-copy">A local place to meet people, start conversations, make friends, find dates, and discover what’s happening around you.</p>
        <div className="actions"><a className="button primary" href="/signup">Create your profile</a><a className="button secondary" href="/login">Log in</a></div>
        <p className="note">18+ only · Your exact location is never displayed.</p>
      </section>
      <section className="value-row"><div><b>Nearby</b><span>Discover people in your area.</span></div><div><b>Natural</b><span>Chat before deciding where it goes.</span></div><div><b>Local</b><span>Built around real communities.</span></div></section>
    </main>
  );
}
