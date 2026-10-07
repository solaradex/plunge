"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Candidate={id:string;display_name:string;gender:string;city:string;state:string;bio:string|null;age:number;distance_miles:number|null;interests:string[];compatibility_score:number};

export default function DiscoveryFeed({initial}:{initial:Candidate[]}){
  const [cards,setCards]=useState(initial);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function like(id:string){
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
  return <div className="discovery-grid">{cards.map(c=><article className="person-card" key={c.id}><div className="person-avatar">{c.display_name.slice(0,1).toUpperCase()}</div><div className="person-body"><div className="person-top"><div><h2>{c.display_name}, {c.age}</h2><p>{c.city}, {c.state}{c.distance_miles!==null?` · ${c.distance_miles} mi away`:""}</p></div><span className="score-pill">{c.compatibility_score}% fit</span></div><p className="person-bio">{c.bio||"No bio yet."}</p><div className="interest-preview left">{c.interests.slice(0,7).map(i=><span key={i}>{i}</span>)}</div><button className="primary-button like-button" disabled={busy} onClick={()=>like(c.id)}>♥ Like</button></div></article>)}</div>;
}
