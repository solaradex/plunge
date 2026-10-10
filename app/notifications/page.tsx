import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivityLink from "@/components/ActivityLink";

type NotificationPayload = { message?: unknown } | null;

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notifications")
    .select("id,notification_type,payload,created_at,read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!error) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <a className="home-logo" href="/home">plunge</a>
        <nav>
          <a href="/home">Discover</a>
          <a href="/matches">Matches</a>
          <ActivityLink />
          <a href="/profile">My profile</a>
        </nav>
      </header>
      <section className="discover-shell">
        <span className="eyebrow">ACTIVITY</span>
        <h1>Notifications</h1>
        {error ? (
          <div className="error-box" role="alert">We couldn’t load your activity. Please refresh and try again.</div>
        ) : (
          <div className="notification-list">
            {(data ?? []).length ? (data ?? []).map((notification) => {
              const payload = notification.payload as NotificationPayload;
              const message = typeof payload?.message === "string"
                ? payload.message
                : "You have new activity.";
              const isMatch = notification.notification_type === "match";
              return (
                <article className="notification-card" key={notification.id}>
                  <div className="empty-icon" aria-hidden="true">{isMatch ? "♥" : "✦"}</div>
                  <div>
                    <strong>{isMatch ? "New match" : "Plunge activity"}</strong>
                    <p>{message}</p>
                    <small>{new Date(notification.created_at).toLocaleString()}</small>
                    {isMatch && <p><Link href="/matches">View your matches →</Link></p>}
                  </div>
                </article>
              );
            }) : (
              <div className="empty-discovery">
                <div className="empty-icon">✦</div>
                <h2>You’re all caught up.</h2>
                <p>New matches and other activity will show up here.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
