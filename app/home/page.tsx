import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name, city, state, bio, gender").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  const { data: interests } = await supabase.from("profile_interests").select("interest_id, interests(name, category)").eq("user_id", user.id);

  return <main className="home-page"><header className="home-header"><a className="home-logo" href="/">plunge</a><nav><a href="/home">Discover</a><a href="/profile">My profile</a></nav></header><section className="discover-shell"><div className="discover-heading"><div><span className="eyebrow">LOCAL DISCOVERY</span><h1>Meet people nearby.</h1><p>Welcome, {profile.display_name}. Find people who fit what you're looking for.</p></div><div className="location-pill">{profile.city}, {profile.state}</div></div><div className="empty-discovery"><div className="empty-icon">✦</div><h2>Your discovery feed is ready for the next step.</h2><p>We have your profile and preferences. The matching engine will use age, gender preference, distance, interests, connection type, and activity to build this feed.</p><div className="profile-preview"><div className="preview-avatar">{profile.display_name.slice(0,1).toUpperCase()}</div><div><strong>{profile.display_name}</strong><span>{profile.city}, {profile.state}</span><small>{profile.bio || "Add a bio to help people get to know you."}</small></div></div><div className="interest-preview">{(interests ?? []).slice(0,8).map((x:any)=><span key={x.interest_id}>{x.interests?.name}</span>)}</div></div></section></main>;
}
