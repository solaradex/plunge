import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export default async function NotificationsPage(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login");
 const {data}=await s.from("notifications").select("id,notification_type,payload,created_at,read_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
 await s.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);
 return <main className="home-page"><header className="home-header"><a className="home-logo" href="/home">plunge</a><nav><a href="/home">Discover</a><a href="/matches">Matches</a><a href="/profile">Profile</a></nav></header><section className="discover-shell"><span className="eyebrow">ACTIVITY</span><h1>Notifications</h1><div className="notification-list">{(data??[]).length?(data??[]).map(n=><article className="notification-card" key={n.id}><div className="empty-icon">✦</div><div><strong>{n.notification_type==="match"?"New match":"Plunge activity"}</strong><p>{(n.payload as any)?.message??"You have new activity."}</p><small>{new Date(n.created_at).toLocaleString()}</small></div></article>):<div className="empty-discovery"><div className="empty-icon">✦</div><h2>You're all caught up.</h2><p>New matches and other activity will show up here.</p></div>}</div></section></main>;
}