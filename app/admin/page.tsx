import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ModerationQueue from "./ModerationQueue";

export default async function AdminPage(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login");
 const {data:isAdmin}=await s.rpc("is_admin");if(!isAdmin)redirect("/home");
 const {data:reports}=await s.from("reports").select("id,reason,details,status,created_at,reported_user_id,reporter_id").eq("status","open").order("created_at",{ascending:true}).limit(100);
 return <main className="home-page"><header className="home-header"><a className="home-logo" href="/home">plunge</a><nav><a href="/home">Discover</a><a href="/notifications">Activity</a><a href="/profile">Profile</a></nav></header><section className="discover-shell"><span className="eyebrow">MODERATION</span><h1>Report queue</h1><p>Review user reports before taking action. Exact private locations and private profile data are not exposed here.</p><div className="admin-list">{(reports??[]).length?(reports??[]).map(r=><article className="admin-report" key={r.id}><div><strong>{r.reason.replaceAll("_"," ")}</strong><p>{r.details||"No additional details."}</p><small>{new Date(r.created_at).toLocaleString()}</small></div><span className="status-pill">{r.status}</span></article>):<div className="empty-discovery"><div className="empty-icon">✓</div><h2>Queue clear.</h2><p>No open reports need review.</p></div>}</div></section></main>;
}