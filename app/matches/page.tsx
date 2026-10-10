import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivityLink from "@/components/ActivityLink";
import MatchesList from "./MatchesList";

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id,user_a_id,user_b_id,created_at")
    .eq("status", "active")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const { data: blocks, error: blocksError } = await supabase
    .rpc("get_my_blocked_user_ids");

  const blockedIds = new Set<string>((blocks ?? []).map((block: { blocked_user_id: string }) => block.blocked_user_id));
  const ids = (matches ?? [])
    .map((match) => match.user_a_id === user.id ? match.user_b_id : match.user_a_id)
    .filter((id) => !blockedIds.has(id));

  const { data: people, error: peopleError } = !matchesError && !blocksError && ids.length
    ? await supabase.from("profiles").select("id,display_name,city,state,bio").in("id", ids)
    : { data: [], error: null };

  const hasError = Boolean(matchesError || blocksError || peopleError);

  return (
    <main className="home-page">
      <header className="home-header">
        <a className="home-logo" href="/">plunge</a>
        <nav>
          <a href="/home">Discover</a>
          <a href="/matches">Matches</a>
          <ActivityLink />
          <a href="/profile">My profile</a>
        </nav>
      </header>
      <section className="discover-shell">
        <div className="discover-heading">
          <div>
            <span className="eyebrow">YOUR CONNECTIONS</span>
            <h1>Matches</h1>
            <p>People who liked you back.</p>
          </div>
        </div>
        {hasError
          ? <div className="error-box" role="alert">We couldn’t load your matches safely. Please refresh and try again.</div>
          : <MatchesList people={people ?? []} />}
      </section>
    </main>
  );
}
