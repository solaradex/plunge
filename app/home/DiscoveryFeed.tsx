"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Candidate={id:string;display_name:string;gender:string;city:string;state:string;bio:string|null;age:number;distance_miles:number|null;interests:string[];compatibility_score:number;photo_path:string|null;photo_url:string|null};

export default function DiscoveryFeed({initial}:{initial:Candidate[]}){
  const [cards,setCards]=useState(initial);
  const [message,setMessage]=useState(""); const [reporting,setReporting]=useState<string|null>(null); const [reason,setReason]=useState("other");
  const [busy,setBusy]=useState(false);
  async function block(id:string){ if(!confirm("Block this person? They will no longer appear in your discovery."))return; const {error}=await createClient().rpc("block_user",{target_user_id:id}); if(error){setMessage(error.message);return} setCards(c=>c.filter(x=>x.id!==id)); setMessage("Profile blocked."); } async function report(id:string){ const {error}=await createClient().rpc("report_user",{target_user_id:id,report_reason:reason,report_details:null}); setReporting(null); setMessage(error?error.message:"Thanks. Your report was submitted for review."); } async function like(id:string){
    setBusy(true);setMessage("");
    const supabase=createClient();
    const {data,error}=await supabase.rpc("like_profile",{target_user_id:id});
    if(error){setMessage(error.message);setBusy(false);return;}
    const matched=Array.isArray(data)?data[0]?.matched:data?.matched;
    setCards(c=>c.filter(x=>x.id!==id));
    setMessage(matched?"It’s a match! 🎉":"Like sent.");
    setBusy(false);
  }
  if(!cards.length)return <div className="empty-discovery"><div className="empty-icon">✦</div><h2>You’re caught up.</h2><p>No new profiles match your current preferences. Try widening your age range or distance when more people join Plunge.</p>{message&&<div className="success-box">{message}</div>}</div>;
  return <div className="discovery-grid">{cards.map(c=><article className="person-card" key={c.id}><div className="person-avatar">{c.photo_url?<img src={c.photo_url} alt={`${c.display_name} profile`} />:c.display_name.slice(0,1).toUpperCase()}</div><div className="person-body"><div className="person-top"><div><h2><a className="profile-link" href={"/profile/"+c.id}>{c.display_name}, {c.age}</a></h2><p>{c.city}, {c.state}{c.distance_miles!==null?` · ${c.distance_miles} mi away`:""}</p></div><span className="score-pill">{c.compatibility_score}% fit</span></div><p className="person-bio">{c.bio||"No bio yet."}</p><div className="interest-preview left">{c.interests.slice(0,7).map(i=><span key={i}>{i}</span>)}</div><button className="primary-button like-button" disabled={busy} onClick={()=>like(c.id)}>♥ Like</button><div className="card-safety"><button type="button" onClick={()=>block(c.id)}>Block</button><button type="button" onClick={()=>setReporting(c.id)}>Report</button></div>{reporting===c.id&&<div className="report-panel"><select value={reason} onChange={e=>setReason(e.target.value)}><option value="other">Other</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="scam">Scam</option><option value="fake_profile">Fake profile</option><option value="inappropriate_image">Inappropriate image</option><option value="threat">Threat</option><option value="underage_concern">Underage concern</option></select><button type="button" onClick={()=>report(c.id)}>Submit report</button><button type="button" onClick={()=>setReporting(null)}>Cancel</button></div>}</div></article>)}</div>;
}
