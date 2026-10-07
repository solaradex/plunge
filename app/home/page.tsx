import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DiscoveryFeed from "./DiscoveryFeed";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, city, state").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");
  const { data: candidates, error } = await supabase.rpc("get_discovery_candidates", { limit_count: 20 });
  return <main className="home-page"><header className="home-header"><a className="home-logo" href="/">plunge</a><nav><a href="/home">Discover</a><a href="/profile">My profile</a></nav></header><section className="discover-shell"><div className="discover-heading"><div><span className="eyebrow">LOCAL DISCOVERY</span><h1>Meet people nearby.</h1><p>Profiles selected using your age, gender, distance, interests, and preferences.</p></div><div className="location-pill">{profile.city}, {profile.state}</div></div>{error?<div className="error-box">We couldn't load discovery right now. Please try again.</div>:<DiscoveryFeed initial={candidates ?? []}/>}</section></main>;
}
