import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; import ActivityLink from "@/components/ActivityLink";
import MatchesList from "./MatchesList";

export default async function MatchesPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login');
 const {data:matches,error}=await supabase.from('matches').select('id,user_a_id,user_b_id,created_at').eq('status','active').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).order('created_at',{ascending:false});
 const ids=(matches??[]).map(m=>m.user_a_id===user.id?m.user_b_id:m.user_a_id);
 const {data:people}=ids.length?await supabase.from('profiles').select('id,display_name,city,state,bio').in('id',ids):{data:[]};
 return <main className="home-page"><header className="home-header"><a className="home-logo" href="/">plunge</a><nav><a href="/home">Discover</a><a href="/matches">Matches</a><ActivityLink /><a href="/profile">My profile</a></nav></header><section className="discover-shell"><div className="discover-heading"><div><span className="eyebrow">YOUR CONNECTIONS</span><h1>Matches</h1><p>People who liked you back.</p></div></div>{error?<div className="error-box">Could not load matches.</div>:<MatchesList people={people??[]}/>}</section></main>;
}
